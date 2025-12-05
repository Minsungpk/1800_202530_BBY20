window.addEventListener("DOMContentLoaded", () => {
    const sheet = document.getElementById("bottomSheet");
  
    // Make functions global so onclick="" can see them
    window.openSheet = function () {
      if (sheet) {
        sheet.classList.add("open");
      }
    };
  
    window.closeSheet = function () {
      if (sheet) {
        sheet.classList.remove("open");
      }
    };
  });
  