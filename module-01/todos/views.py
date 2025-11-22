from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Todo


class TodoListView(ListView):
    """
    View to display all TODO items.
    Shows completed and incomplete TODOs.
    """
    model = Todo
    template_name = 'todos/todo_list.html'
    context_object_name = 'todos'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Separate completed and incomplete todos
        context['incomplete_todos'] = self.model.objects.filter(is_completed=False)
        context['completed_todos'] = self.model.objects.filter(is_completed=True)
        return context


class TodoCreateView(CreateView):
    """
    View to create a new TODO item.
    """
    model = Todo
    template_name = 'todos/todo_form.html'
    fields = ['title', 'description', 'due_date']
    success_url = reverse_lazy('todo-list')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['action'] = 'Create'
        return context


class TodoUpdateView(UpdateView):
    """
    View to edit an existing TODO item.
    """
    model = Todo
    template_name = 'todos/todo_form.html'
    fields = ['title', 'description', 'due_date', 'is_completed']
    success_url = reverse_lazy('todo-list')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['action'] = 'Update'
        return context


class TodoDeleteView(DeleteView):
    """
    View to delete a TODO item.
    """
    model = Todo
    template_name = 'todos/todo_confirm_delete.html'
    success_url = reverse_lazy('todo-list')


def toggle_todo(request, pk):
    """
    View to toggle the completion status of a TODO.
    """
    todo = get_object_or_404(Todo, pk=pk)
    todo.is_completed = not todo.is_completed
    todo.save()
    return redirect('todo-list')
