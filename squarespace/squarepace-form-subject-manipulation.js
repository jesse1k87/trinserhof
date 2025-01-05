window.addEventListener("load", (event) => {
  setInterval(() => {
    const form = document.getElementsByClassName("react-form-contents")[0];
    if (form) {
      Array.from(form.elements).forEach((input) => {
        if (input.placeholder === "Subject") {
          // input.style.color = "transparent";
          // input.style["background-color"] = "transparent";
          // input.style.border = "none";

          const now = new Date();
          input.setAttribute("value", now.toLocaleString());
          input.value = now.toLocaleString();
          // const wrapper = document.getElementById(input.id.replace("-field", ""));
          // if (wrapper) {
          //   wrapper.style.display = "none";
          // }
        }
      });
    }
  }, 500);
});
