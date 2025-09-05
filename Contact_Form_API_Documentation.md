# Contact Form API Documentation

## 📧 Submit Contact Form

**Public endpoint for submitting contact form messages. No authentication required.**

### Endpoint Details

```
POST /contact
```

**Base URL:** `/contact`

---

## 📝 Request

### Headers
```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | ✅ Yes | - | Full name of the person |
| `email` | string | ✅ Yes | - | Valid email address |
| `message` | string | ✅ Yes | - | Contact message content |
| `category` | string | ❌ No | `"general"` | Message category |
| `priority` | string | ❌ No | `"medium"` | Message priority |
| `source` | string | ❌ No | `"website"` | Source of the contact |

### Field Options

#### Category Options
- `"general"` - General inquiries (default)
- `"project-inquiry"` - Project-related questions
- `"collaboration"` - Collaboration opportunities
- `"feedback"` - Feedback and suggestions
- `"other"` - Other types of messages

#### Priority Options
- `"low"` - Low priority
- `"medium"` - Medium priority (default)
- `"high"` - High priority

#### Source Options
- `"website"` - From portfolio website (default)
- `"email"` - Direct email
- `"other"` - Other sources

---

## 📤 Example Request

### Basic Contact Form (Minimum Required)
```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "message": "Hello! I'm interested in your web development services."
}
```

### Complete Contact Form (All Fields)
```json
{
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "message": "Hi Abhishek! I came across your portfolio and I'm impressed with your work. We have an exciting project coming up and would love to discuss a potential collaboration. Could we schedule a call to discuss the details?",
    "category": "project-inquiry",
    "priority": "high",
    "source": "website"
}
```

---

## 📥 Response

### Success Response (HTTP 201)
```json
{
    "success": true,
    "message": "Thank you for reaching out! Your message has been received successfully.",
    "data": {
        "id": "64f7b1c8e4b0123456789abc",
        "status": "open",
        "createdAt": "2025-09-05T10:30:00.000Z"
    }
}
```

### Error Response (HTTP 400)
```json
{
    "success": false,
    "message": "All fields are required",
    "code": "FIELDS_REQUIRED",
    "details": "Please provide name, email, and message."
}
```

---

## 💻 Frontend Integration Examples

### JavaScript (Fetch API)
```javascript
async function submitContactForm(formData) {
    try {
        const response = await fetch('https://your-api-domain.com/api/v1/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                message: formData.message,
                category: formData.category || 'general'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Message sent successfully!');
            // Show success message to user
            showSuccessMessage(result.message);
        } else {
            console.error('Error:', result.message);
            // Show error message to user
            showErrorMessage(result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        showErrorMessage('Unable to send message. Please try again.');
    }
}

// Usage
const contactData = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from your portfolio!',
    category: 'general'
};

submitContactForm(contactData);
```

### React Hook Example
```jsx
import { useState } from 'react';

const useContactForm = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const submitContact = async (formData) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/v1/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Unable to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return { submitContact, loading, success, error };
};

// Usage in component
const ContactForm = () => {
    const { submitContact, loading, success, error } = useContactForm();

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        submitContact({
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
            category: formData.get('category') || 'general'
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            {success && <p>Message sent successfully!</p>}
            {error && <p>Error: {error}</p>}
            <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
            </button>
        </form>
    );
};
```

### jQuery Example
```javascript
$('#contactForm').on('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: $('#name').val(),
        email: $('#email').val(),
        message: $('#message').val(),
        category: $('#category').val() || 'general'
    };

    $.ajax({
        url: 'https://your-api-domain.com/api/v1/contact',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            if (response.success) {
                $('#successMessage').show().text(response.message);
                $('#contactForm')[0].reset();
            }
        },
        error: function(xhr) {
            const error = xhr.responseJSON;
            $('#errorMessage').show().text(error.message || 'An error occurred');
        }
    });
});
```

---

## 🔍 Validation Rules

### Name Field
- **Required:** Yes
- **Type:** String
- **Min Length:** 1 character (after trimming)
- **Max Length:** No specific limit
- **Validation:** Automatically trimmed of whitespace

### Email Field
- **Required:** Yes
- **Type:** String
- **Format:** Valid email address
- **Validation:** Automatically converted to lowercase and trimmed

### Message Field
- **Required:** Yes
- **Type:** String
- **Min Length:** 1 character (after trimming)
- **Max Length:** No specific limit
- **Validation:** Automatically trimmed of whitespace

---

## ✨ What Happens After Submission

1. **Instant Response:** You receive immediate confirmation
2. **User Email:** A confirmation email is sent to the submitted email address
3. **Admin Notification:** Admin receives an email notification about the new message
4. **Message Storage:** Your message is securely stored for admin review
5. **Status Tracking:** Message is assigned "open" status for follow-up

---

## 🚨 Error Handling

### Common Error Responses

#### Missing Required Fields (400)
```json
{
    "success": false,
    "message": "All fields are required",
    "code": "FIELDS_REQUIRED",
    "details": "Please provide name, email, and message."
}
```

#### Invalid Data (400)
```json
{
    "success": false,
    "message": "Invalid contact data",
    "code": "INVALID_CONTACT_DATA",
    "details": "Validation error details..."
}
```

#### Server Error (500)
```json
{
    "success": false,
    "message": "Failed to create contact message",
    "code": "CONTACT_CREATION_FAILED",
    "details": "Internal server error details..."
}
```

---

## 🧪 Testing with cURL

### Basic Test
```bash
curl -X POST https://your-api-domain.com/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message from the API documentation."
  }'
```

### Complete Test
```bash
curl -X POST https://your-api-domain.com/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@company.com",
    "message": "Interested in collaboration opportunities.",
    "category": "collaboration",
    "priority": "high",
    "source": "website"
  }'
```

---

## 📋 Quick Checklist for Integration

- [ ] Set correct API endpoint URL
- [ ] Include `Content-Type: application/json` header
- [ ] Validate required fields (name, email, message) on frontend
- [ ] Handle success response appropriately
- [ ] Display error messages to users
- [ ] Show loading state during submission
- [ ] Reset form after successful submission
- [ ] Test with various input combinations
- [ ] Verify email notifications are received

---

## 🎯 Best Practices

1. **Client-Side Validation:** Validate fields before sending to reduce server load
2. **User Feedback:** Always show loading, success, and error states
3. **Form Reset:** Clear form after successful submission
4. **Error Handling:** Gracefully handle network errors and API errors
5. **Email Validation:** Use proper email validation on frontend
6. **Rate Limiting:** Implement frontend rate limiting to prevent spam
7. **Accessibility:** Ensure form is accessible with proper labels and ARIA attributes

---

**Need help?** Contact the API administrator or check the server logs for detailed error information.
