document.addEventListener('DOMContentLoaded', function() {
    // Select all images inside image containers
    var images = document.querySelectorAll('.image-container img');
  
    images.forEach(function(image) {
        // Get the image URL from the data-src attribute
        var imageUrl = image.getAttribute('data-src');
        
        // Set the image src attribute to start loading the image
        image.src = imageUrl;

        // Once the src is set, listen for the load event
        image.onload = function() {
            // Image has loaded
            // Remove the placeholder
            var placeholder = image.previousElementSibling; // Assuming the placeholder is immediately before the img
            if (placeholder && placeholder.classList.contains('placeholder')) {
                placeholder.style.display = 'none'; // Hide placeholder
            }
            image.style.display = 'block'; // Make sure the image is shown
        };
    });
  });