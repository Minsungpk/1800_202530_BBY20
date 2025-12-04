const img1 = document.getElementById("image1");
const img2 = document.getElementById("image2");

img1.onclick = () => {
  img1.classList.add("hide");
  img2.classList.add("show");
};

img2.onclick = () => {
  img1.classList.remove("hide");
  img2.classList.remove("show");
};
