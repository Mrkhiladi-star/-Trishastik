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
  