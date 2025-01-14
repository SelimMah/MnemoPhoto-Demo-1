const selectButton = document.getElementById("select-button");
const selectOptions = document.getElementById("select-options");

// Toggle the visibility of the options on button click
selectButton.addEventListener("click", () => {
  selectOptions.style.display =
    selectOptions.style.display === "block" ? "none" : "block";
});

// Close the dropdown if the user clicks outside
document.addEventListener("click", (event) => {
  if (
    !selectButton.contains(event.target) &&
    !selectOptions.contains(event.target)
  ) {
    selectOptions.style.display = "none";
  }
});

// Add event listeners to each option
selectOptions.querySelectorAll(".option").forEach((option) => {
  option.addEventListener("click", (event) => {
    selectButton.textContent = event.target.textContent;
    selectButton.dataset.value = event.target.dataset.value;
    selectOptions.style.display = "none"; // Hide the dropdown
  });
});
