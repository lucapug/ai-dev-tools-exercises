from django.db import models


class Todo(models.Model):
    """
    Model representing a TODO item.
    
    Attributes:
        title: The title/name of the TODO item
        description: Optional detailed description
        due_date: Optional due date for the TODO
        is_completed: Boolean flag to mark TODO as resolved/completed
        created_at: Timestamp when the TODO was created
        updated_at: Timestamp when the TODO was last updated
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'TODO'
        verbose_name_plural = 'TODOs'
    
    def __str__(self):
        return self.title
