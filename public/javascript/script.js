document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const sidebar = document.getElementById("sidebar");
  const buttonClose = document.getElementById("button-close");

  const toggleNavLinks = () => {
      navLinks.classList.toggle("hidden"); 
  };

  const toggleSidebar = () => {
      sidebar.classList.toggle("hidden"); 
  };


  menuToggle.addEventListener("click", function () {
      toggleSidebar();  
    
      navLinks.classList.add("hidden");
  });

  
  buttonClose.addEventListener("click", function () {
      sidebar.classList.add("hidden"); 
  });

  
  document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && !menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
          sidebar.classList.add("hidden"); 
         
      }
  });
});
document.querySelectorAll('.btn-close').forEach(function(button) {
  button.addEventListener('click', function() {
    const alert = this.closest('.alert');
    alert.classList.add('d-none');
  });
});

function autoDismissAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    setTimeout(function() {
  
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 2000); 
  }
}


if (document.getElementById('success-alert')) {
  autoDismissAlert('success-alert');
}

if (document.getElementById('error-alert')) {
  autoDismissAlert('error-alert');
}
document.getElementById("toggle-sidebar").addEventListener("click", function() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("open");
});
// On page load, ensure sidebar is hidden
document.addEventListener("DOMContentLoaded", function() {
const sidebar = document.querySelector(".sidebar");
sidebar.classList.remove("open");  // Ensure it's hidden initially
});

// Toggle sidebar visibility on button click
document.getElementById("toggle-sidebar").addEventListener("click", function() {
const sidebar = document.querySelector(".sidebar");
sidebar.classList.toggle("open");  // Toggle visibility
});
// Get the sidebar and buttons
const sidebar = document.getElementById("sidebar");
const toggleButton = document.getElementById("toggle-sidebar");
const closeButton = document.getElementById("button-close");

// Ensure the sidebar is hidden when the page loads (no need to use localStorage)
document.addEventListener("DOMContentLoaded", function() {
// Ensure the sidebar is hidden by default when the page loads
sidebar.classList.remove("open");
});

// Toggle sidebar visibility on button click
toggleButton.addEventListener("click", function() {
sidebar.classList.toggle("open");  // Toggle the 'open' class to show/hide the sidebar
});

// Close the sidebar when the close button inside the sidebar is clicked
closeButton.addEventListener("click", function() {
sidebar.classList.remove("open");  // Remove the 'open' class to hide the sidebar
});
document.addEventListener("DOMContentLoaded", function() {
sidebar.classList.remove("open"); // Sidebar starts off-screen (hidden)
});


// Get elements
const profileToggle = document.getElementById('profile-toggle');
const profileBox = document.querySelector('.profile-box');

// Add click event listener to the profile image (trigger the profile box toggle)
profileToggle.addEventListener('click', function(event) {
event.stopPropagation(); // Prevent the event from bubbling up to document click handler

// Toggle the visibility of the profile menu
profileBox.classList.toggle('hidden');
});

// Close the profile box if clicking outside of it
document.addEventListener('click', function(event) {
// If the click is outside the profile box and profile toggle (profile picture)
if (!profileBox.contains(event.target) && !profileToggle.contains(event.target)) {
  profileBox.classList.add('hidden'); // Hide the profile menu
}
});
document.addEventListener("DOMContentLoaded", function() {
const profileToggle = document.getElementById('profile-toggle');
const profileBox = document.querySelector('.profile-box');

// Toggle the visibility of the profile menu when the profile picture is clicked
profileToggle.addEventListener('click', function(event) {
  event.stopPropagation(); // Prevent the click from closing the menu immediately
  profileBox.classList.toggle('hidden');
});

// Close the profile box when clicking outside of it
document.addEventListener('click', function(event) {
  // Check if the click is outside the profile box or profile toggle (profile picture)
  if (!profileBox.contains(event.target) && !profileToggle.contains(event.target)) {
    profileBox.classList.add('hidden'); // Hide the profile menu
  }
});
});
document.addEventListener("DOMContentLoaded", function() {
const profileToggle = document.getElementById('profile-toggle');
const profileBox = document.querySelector('.profile-box');

// Toggle the visibility of the profile menu when the profile picture is clicked
profileToggle.addEventListener('click', function(event) {
  event.stopPropagation(); // Prevent the click from closing the menu immediately
  profileBox.classList.toggle('hidden');
});

// Close the profile box when clicking outside of it
document.addEventListener('click', function(event) {
  // Check if the click is outside the profile box or profile toggle (profile picture)
  if (!profileBox.contains(event.target) && !profileToggle.contains(event.target)) {
    profileBox.classList.add('hidden'); // Hide the profile menu
  }
});
});