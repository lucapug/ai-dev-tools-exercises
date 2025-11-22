from django.test import TestCase, Client
from django.urls import reverse
from datetime import date, timedelta
from .models import Todo


class TodoModelTest(TestCase):
    """Test suite for the Todo model"""
    
    def setUp(self):
        """Set up test data"""
        self.todo = Todo.objects.create(
            title="Test TODO",
            description="Test description",
            due_date=date.today() + timedelta(days=7)
        )
    
    def test_todo_creation(self):
        """Test that a TODO is created correctly"""
        self.assertEqual(self.todo.title, "Test TODO")
        self.assertEqual(self.todo.description, "Test description")
        self.assertIsNotNone(self.todo.due_date)
        self.assertFalse(self.todo.is_completed)  # Default value
    
    def test_todo_str_representation(self):
        """Test the string representation of TODO"""
        self.assertEqual(str(self.todo), "Test TODO")
    
    def test_todo_default_values(self):
        """Test default values are set correctly"""
        simple_todo = Todo.objects.create(title="Simple TODO")
        self.assertFalse(simple_todo.is_completed)
        self.assertIsNone(simple_todo.description)
        self.assertIsNone(simple_todo.due_date)
    
    def test_todo_ordering(self):
        """Test that TODOs are ordered by creation date (newest first)"""
        todo2 = Todo.objects.create(title="Second TODO")
        todos = Todo.objects.all()
        self.assertEqual(todos[0], todo2)  # Most recent first


class TodoViewTest(TestCase):
    """Test suite for TODO views"""
    
    def setUp(self):
        """Set up test client and test data"""
        self.client = Client()
        self.todo1 = Todo.objects.create(
            title="Active TODO",
            description="This is active"
        )
        self.todo2 = Todo.objects.create(
            title="Completed TODO",
            description="This is completed",
            is_completed=True
        )
    
    def test_todo_list_view(self):
        """Test that the TODO list view displays correctly"""
        response = self.client.get(reverse('todo-list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_list.html')
        self.assertIn('incomplete_todos', response.context)
        self.assertIn('completed_todos', response.context)
    
    def test_todo_list_separation(self):
        """Test that completed and incomplete TODOs are separated"""
        response = self.client.get(reverse('todo-list'))
        incomplete = response.context['incomplete_todos']
        completed = response.context['completed_todos']
        
        self.assertEqual(incomplete.count(), 1)
        self.assertEqual(completed.count(), 1)
        self.assertIn(self.todo1, incomplete)
        self.assertIn(self.todo2, completed)
    
    def test_todo_create_view_get(self):
        """Test GET request to create TODO view"""
        response = self.client.get(reverse('todo-create'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_form.html')
    
    def test_todo_create_view_post(self):
        """Test POST request to create a new TODO"""
        data = {
            'title': 'New TODO',
            'description': 'New description',
            'due_date': date.today() + timedelta(days=5)
        }
        response = self.client.post(reverse('todo-create'), data)
        self.assertEqual(response.status_code, 302)  # Redirect after success
        self.assertTrue(Todo.objects.filter(title='New TODO').exists())
    
    def test_todo_update_view_get(self):
        """Test GET request to update TODO view"""
        response = self.client.get(reverse('todo-update', args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_form.html')
    
    def test_todo_update_view_post(self):
        """Test POST request to update a TODO"""
        data = {
            'title': 'Updated TODO',
            'description': 'Updated description',
            'is_completed': True
        }
        response = self.client.post(
            reverse('todo-update', args=[self.todo1.pk]), 
            data
        )
        self.assertEqual(response.status_code, 302)
        self.todo1.refresh_from_db()
        self.assertEqual(self.todo1.title, 'Updated TODO')
        self.assertTrue(self.todo1.is_completed)
    
    def test_todo_delete_view_get(self):
        """Test GET request to delete TODO view (confirmation page)"""
        response = self.client.get(reverse('todo-delete', args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_confirm_delete.html')
    
    def test_todo_delete_view_post(self):
        """Test POST request to delete a TODO"""
        todo_pk = self.todo1.pk
        response = self.client.post(reverse('todo-delete', args=[todo_pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Todo.objects.filter(pk=todo_pk).exists())
    
    def test_toggle_todo_incomplete_to_complete(self):
        """Test toggling a TODO from incomplete to complete"""
        self.assertFalse(self.todo1.is_completed)
        response = self.client.post(reverse('todo-toggle', args=[self.todo1.pk]))
        self.assertEqual(response.status_code, 302)
        self.todo1.refresh_from_db()
        self.assertTrue(self.todo1.is_completed)
    
    def test_toggle_todo_complete_to_incomplete(self):
        """Test toggling a TODO from complete to incomplete"""
        self.assertTrue(self.todo2.is_completed)
        response = self.client.post(reverse('todo-toggle', args=[self.todo2.pk]))
        self.assertEqual(response.status_code, 302)
        self.todo2.refresh_from_db()
        self.assertFalse(self.todo2.is_completed)
    
    def test_create_todo_without_optional_fields(self):
        """Test creating a TODO with only required fields"""
        data = {'title': 'Minimal TODO'}
        response = self.client.post(reverse('todo-create'), data)
        self.assertEqual(response.status_code, 302)
        todo = Todo.objects.get(title='Minimal TODO')
        # Description can be empty string when submitted via form
        self.assertTrue(todo.description == '' or todo.description is None)
        self.assertIsNone(todo.due_date)
    
    def test_todo_with_due_date(self):
        """Test creating and displaying TODO with due date"""
        future_date = date.today() + timedelta(days=10)
        data = {
            'title': 'TODO with deadline',
            'due_date': future_date
        }
        self.client.post(reverse('todo-create'), data)
        todo = Todo.objects.get(title='TODO with deadline')
        self.assertEqual(todo.due_date, future_date)
