(() => {
  console.log(window.location.href === `${baseUrl}/myaccount`);
  // if (
  //   !document.querySelector(".ex-a-2363423.ex-u-2046736.ex-customer") &&
  //   window.location.pathname !== "/myaccount"
  // )
  //   return;
  function createTourStyle() {
    const style = document.createElement("style");
    style.classList.add("tour-style");
    style.textContent = `
    .tour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      /*background-color: rgba(0, 0, 0, 0.7);*/
      z-index: 9998;
      transition: opacity 0.3s ease;
    }
    
    .tour-spotlight {
      position: fixed;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
      border-radius: 4px;
      z-index: 9999;
      transition: all 0.3s ease;
    }
    
    .tour-spotlight-cursor{
      cursor: pointer;
    }

    .tour-tooltip {
      position: fixed;
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 300px;
      transition: opacity 0.3s ease;
    }
    
    .tour-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      font-size: 20px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
      color: #666;
    }
    
    .tour-close:hover {
      color: #000;
    }
    
    .tour-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .tour-btn-prev {
      background: #f1f1f1;
      color: #333;
    }
    
    .tour-btn-next {
      background: #4285f4;
      color: white;
    }
    
    .tour-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .tour-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin: 0 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    
    .tour-dot-active {
      background-color: #4285f4;
    }
    
    .tour-dot-inactive {
      background-color: #ccc;
    }
    
    .tour-title {
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .tour-description {
      margin-bottom: 15px;
    }
    
    .tour-dots {
      margin-bottom: 10px;
      text-align: center;
    }
    
    .tour-buttons {
      display: flex;
      justify-content: space-between;
    }

  `;
    document.head.appendChild(style);
  }

  class WebPageTour {
    constructor(steps, stepToStart) {
      this.steps = steps.filter((step) => {
        return !step.element || document.querySelector(step.element);
      });
      this.currentStep = stepToStart > steps.length ? 0 : stepToStart - 1;
      this.stepToStart = stepToStart - 1;
      this.lastStep = 0;
      this.overlay = null;
      this.spotlight = null;
      this.tooltipElement = null;
      this.tooltipCloseButton = null;
      this.tooltipTitle = null;
      this.tooltipDescription = null;
      this.tooltipDots = null;
      this.tooltipButtons = null;
      this.originalOverflowStyle = "";
      this.isActive = false;
      this.isInProcess = false;
      this.scrollLockTimeout = null;
      this.lastActiveButton = null;
      this.inProgress = false;
      this.isSmallScreen = false;

      // Bind methods to maintain 'this' context
      this.handleResize = this.handleResize.bind(this);
      this.activateButton = this.activateButton.bind(this);
    }

    start() {
      if (this.isActive) return;
      if (window.innerWidth < 769 || window.innerHeight < 500) return;

      //Disable all scroll interaction
      this.disableScroll();

      // Store original scroll state
      this.originalOverflowStyle = document.body.style.overflow || "";

      // Create overlay
      this.overlay = document.createElement("div");
      this.overlay.classList.add("tour-overlay");

      // Create spotlight container
      this.spotlight = document.createElement("div");
      this.spotlight.classList.add("tour-spotlight");

      /* ===== Create Tooltip =====*/

      // Create tooltip Element
      this.tooltipElement = document.createElement("div");
      this.tooltipElement.classList.add("tour-tooltip");
      // Create close button
      this.tooltipCloseButton = document.createElement("div");
      this.tooltipCloseButton.classList.add("tour-close");
      this.tooltipCloseButton.setAttribute("aria-label", "Close tour");
      this.tooltipCloseButton.innerHTML = "&times;";
      this.tooltipCloseButton.addEventListener("click", this.end);
      // Create tooltip title
      this.tooltipTitle = document.createElement("div");
      this.tooltipTitle.classList.add("tour-title");
      // Create tooltip description
      this.tooltipDescription = document.createElement("div");
      this.tooltipDescription.classList.add("tour-description");
      // Create tooltip dots
      this.tooltipDots = document.createElement("div");
      this.tooltipDots.classList.add("tour-dots");
      for (let i = 0; i < this.steps.length; i++) {
        const spanEl = document.createElement("span");
        spanEl.classList.add("tour-dot");
        spanEl.dataset.step = i;
        spanEl.classList.add(
          `tour-dot-${i === this.currentStep ? "active" : "inactive"}`
        );
        this.tooltipDots.append(spanEl);
      }

      // Create tooltip buttons
      this.tooltipButtons = document.createElement("div");
      this.tooltipButtons.classList.add("tour-buttons");
      for (let i = 1; i < 3; i++) {
        const buttonEl = document.createElement("button");
        buttonEl.classList.add(
          "tour-btn",
          `tour-btn-${i % 2 === 0 ? "next" : "prev"}`
        );
        if (!this.currentStep && i === 1)
          buttonEl.setAttribute("disabled", "true");
        buttonEl.addEventListener("click", i % 2 === 0 ? this.next : this.prev);
        this.tooltipButtons.append(buttonEl);
      }
      /* ===== End of creating Tooltip =====*/

      // Append elements to tooltip body
      this.tooltipElement.append(
        this.tooltipCloseButton,
        this.tooltipTitle,
        this.tooltipDescription,
        this.tooltipDots,
        this.tooltipButtons
      );
      // Append elements to body
      document.body.appendChild(this.overlay);
      document.body.appendChild(this.spotlight);
      document.body.appendChild(this.tooltipElement);

      // Add evvent listener to tooltip
      this.tooltipElement.addEventListener("click", (e) => {
        if (e.target.id === "show-lightbox-show") {
          this.end();
          this.openGalery();
        }
      });

      // Lock scrolling
      document.body.style.overflow = "hidden";

      this.isActive = true;

      // Handle escape key to close tour
      document.addEventListener("keydown", this.handleKeyDown);

      // Handle window resize
      window.addEventListener("resize", this.handleResize);

      // Show first step after a small delay to ensure DOM is ready
      setTimeout(() => {
        this.showStep(this.currentStep);
      }, 100);
    }

    handleKeyDown = (e) => {
      if (e.key === "Escape") {
        this.end();
      } else if (e.key === "ArrowRight") {
        this.next();
      } else if (e.key === "ArrowLeft") {
        this.prev();
      }
    };

    openGalery = () => {
      Fancybox.show([
        {
          src: "/public/images/slide_Page_01.jpg",
          type: "image",
          caption: "Image 1",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_02.jpg",
          type: "image",
          caption: "Image 2",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_03.jpg",
          type: "image",
          caption: "Image 3",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_04.jpg",
          type: "image",
          caption: "Image 4",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_05.jpg",
          type: "image",
          caption: "Image 5",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_06.jpg",
          type: "image",
          caption: "Image 6",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_07.jpg",
          type: "image",
          caption: "Image 7",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_08.jpg",
          type: "image",
          caption: "Image 8",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_09.jpg",
          type: "image",
          caption: "Image 9",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_10.jpg",
          type: "image",
          caption: "Image 10",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_11.jpg",
          type: "image",
          caption: "Image 11",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_12.jpg",
          type: "image",
          caption: "Image 12",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_13.jpg",
          type: "image",
          caption: "Image 13",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_14.jpg",
          type: "image",
          caption: "Image 14",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_15.jpg",
          type: "image",
          caption: "Image 15",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_16.jpg",
          type: "image",
          caption: "Image 16",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_17.jpg",
          type: "image",
          caption: "Image 17",
        },
        {
          src: "https://us.evocdn.io/dealer/1348/content/media/My_Theme/assets/slide-tour/slide_Page_18.jpg",
          type: "image",
          caption: "Image 18",
        },
      ]);
    };

    handleResize() {
      if (!this.isActive) return;
      if (window.innerWidth < 769 || window.innerHeight < 500) {
        if (this.isSmallScreen) return;
        this.hideSpotlight();
        this.isSmallScreen = true;

        this.tooltipDots = this.tooltipElement.querySelector(".tour-dots");
        this.tooltipButtons =
          this.tooltipElement.querySelector(".tour-buttons");
        this.tooltipTitle = this.tooltipElement.querySelector(".tour-title");
        this.tooltipDescription =
          this.tooltipElement.querySelector(".tour-description");

        this.tooltipTitle.textContent = "Resize the window";
        this.tooltipDescription.textContent =
          "To use our tour, please resize your window";
        this.tooltipDots.style.display = "none";
        this.tooltipButtons.style.display = "none";

        this.tooltipElement.style =
          "top: 200px; left: 50%; transform: translateX(-50%)";
      } else {
        const step = this.steps[this.currentStep];
        // Destructuring adjustment of tooltip and spotlight
        const {
          adjust_tooltip: { top: tooltipTop = 0, left: tooltipLeft = 0 } = {},
          adjust_spotlight: {
            top: spotlightTop = 0,
            left: spotlightLeft = 0,
            width: spotlightWidth = 0,
            height: spotlightHeight = 0,
          } = {},
        } = step;
        // Reposition spotlight and tooltip when window is resized
        const element = document.querySelector(
          this.steps[this.currentStep].element
        );

        if (element) {
          this.updateSpotlightPosition(element, {
            spotlightTop,
            spotlightLeft,
            spotlightHeight,
            spotlightWidth,
          });
          this.positionTooltip(element.getBoundingClientRect(), {
            tooltipTop,
            tooltipLeft,
          });
        }
        if (this.isSmallScreen) {
          this.createTooltipContent(this.currentStep);
          this.isSmallScreen = false;
        }
      }
    }

    async showStep(stepIndex) {
      if (this.inProgress) return;
      this.inProgress = true;
      this.currentStep = stepIndex;

      // Check for object keys and assign value
      if (this.steps[this.currentStep].activateButton === undefined) {
        this.steps[this.currentStep] = { activateButton: "" };
      }
      // Remove Event Listener to tooltip
      if (this.steps[this.lastStep].click_listener) {
        this.spotlight.classList.remove("tour-spotlight-cursor");
        this.spotlight.removeEventListener("click", () => {
          this.next();
        });
      }

      this.lastActiveButton = this.steps[this.lastStep].activateButton;
      const currentBtn = this.steps[this.currentStep].activateButton;
      const isBtnActive = this.lastActiveButton === currentBtn;

      // Deactivate the button from last step if there is one and it is not the same as current one and activate one if there is "activateButton" option. isBtnActive shows that we don't need to adjust spotlight because current element is active and no transition

      if (this.lastActiveButton && currentBtn && !isBtnActive) {
        this.activateButton(this.steps[this.lastStep]);
        await this.activateButton(this.steps[this.currentStep]);
      } else if (!this.lastActiveButton && currentBtn) {
        await this.activateButton(this.steps[this.currentStep]);
      } else if (this.lastActiveButton && !currentBtn) {
        this.activateButton(this.steps[this.lastStep]);
      }
      this.lastActiveButton = currentBtn;

      const step = this.steps[this.currentStep];
      let element;
      // Destructuring adjustment of tooltip and spotlight
      const {
        adjust_tooltip: { top: tooltipTop = 0, left: tooltipLeft = 0 } = {},
        adjust_spotlight: {
          top: spotlightTop = 0,
          left: spotlightLeft = 0,
          width: spotlightWidth = 0,
          height: spotlightHeight = 0,
        } = {},
      } = step;

      // Check if there is an element or no element but last window is opened
      if (step.element) {
        element = document.querySelector(step.element);
        if (!element) {
          console.error(`Element not found: ${step.element}`);
          this.inProgress = false;
          this.next();
          return;
        }

        // Get element position
        let elementRect;
        let isInViewport;
        elementRect = element.getBoundingClientRect();
        isInViewport =
          elementRect.top >= 0 &&
          elementRect.bottom <= window.innerHeight &&
          elementRect.left >= 0 &&
          elementRect.right <= window.innerWidth;

        // Check if element is in a viewport with adjustments that element moves to
        if (!isInViewport) {
          // Make spotlight small/invisible before moving to the element
          this.shrinkSpotlight();
          // Handle scrolling differently
          let scrollPromise;

          if (this.steps[this.currentStep].fixed_element) {
            const container = this.steps[this.currentStep].fixed_element;
            scrollPromise = this.scrollToElementInFixedContainer(element);
          } else {
            scrollPromise = this.scrollToElement(element);
          }

          await scrollPromise;
          // Update positions after scroll completes
          elementRect = element.getBoundingClientRect();
          this.updateSpotlightPosition(element, {
            spotlightTop,
            spotlightLeft,
            spotlightHeight,
            spotlightWidth,
          });
          this.positionTooltip(elementRect, {
            tooltipTop,
            tooltipLeft,
          });
        } else {
          // Element is already in viewport
          this.updateSpotlightPosition(element, {
            spotlightTop,
            spotlightLeft,
            spotlightHeight,
            spotlightWidth,
          });
          this.positionTooltip(elementRect, {
            tooltipTop,
            tooltipLeft,
          });
        }
      } else {
        if (window.scrollY) {
          this.hideSpotlight();
          this.scrollToTop().then(() => {
            this.positionTooltipToTop();
          });
        } else {
          this.hideSpotlight();
          this.positionTooltipToTop();
        }
      }

      // Create tooltip content
      this.createTooltipContent(stepIndex);

      // Add Event Listener to tooltip
      if (this.steps[this.currentStep].click_listener) {
        this.spotlight.classList.add("tour-spotlight-cursor");
        this.spotlight.addEventListener("click", () => {
          this.next();
        });
      }
      this.lastStep = this.currentStep;
      this.inProgress = false;
    }
    scrollToTop() {
      return new Promise((resolve) => {
        // Temporarily restore scrolling
        document.body.style.overflow = "auto";

        // Scroll to the top
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        // Clear any existing timeout
        if (this.scrollLockTimeout) {
          clearTimeout(this.scrollLockTimeout);
        }

        // Wait for scroll to complete
        this.scrollLockTimeout = setTimeout(() => {
          // Re-disable scrolling
          document.body.style.overflow = "hidden";
          resolve();
        }, 800);
      });
    }

    hideSpotlight() {
      Object.assign(this.spotlight.style, {
        top: "0px",
        left: "0px",
        width: "0px",
        height: "0px",
      });
    }

    shrinkSpotlight() {
      const originalTop = parseInt(this.spotlight.style.top);
      const originalLeft = parseInt(this.spotlight.style.left);
      const originalHeight = parseInt(this.spotlight.style.height);
      const originalWidth = parseInt(this.spotlight.style.width);
      Object.assign(this.spotlight.style, {
        top: `${originalTop + originalHeight / 2}px`,
        left: `${originalLeft + originalWidth / 2}px`,
        width: "0px",
        height: "0px",
      });
    }
    positionTooltipToTop() {
      Object.assign(this.tooltipElement.style, {
        top: "200px",
        left: "50%",
        transform: "TranslateX(-50%)",
      });
    }

    scrollToElement(element) {
      return new Promise((resolve) => {
        // Temporarily restore scrolling
        document.body.style.overflow = "auto";

        // Get element position relative to the document
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offset = window.innerHeight / 3; // Position element at 1/3 of viewport

        // Scroll to the element with offset
        window.scrollTo({
          top: elementPosition - offset,
          behavior: "smooth",
        });

        // Clear any existing timeout
        if (this.scrollLockTimeout) {
          clearTimeout(this.scrollLockTimeout);
        }

        // Wait for scroll to complete
        this.scrollLockTimeout = setTimeout(() => {
          // Re-disable scrolling
          document.body.style.overflow = "hidden";
          resolve();
        }, 500);
      });
    }

    scrollToElementInFixedContainer(element) {
      return new Promise((resolve) => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        if (this.scrollLockTimeout) {
          clearTimeout(this.scrollLockTimeout);
        }

        this.scrollLockTimeout = setTimeout(() => {
          resolve();
        }, 500);
      });
    }

    createTooltipContent(stepIndex) {
      const step = this.steps[stepIndex];
      const isLastStep = stepIndex === this.steps.length - 1;
      const isFirstStep = stepIndex === 0;

      // Create step dots
      let dotsHTML = "";
      for (let i = this.stepToStart; i < this.steps.length; i++) {
        dotsHTML += `<span class="tour-dot ${
          i === stepIndex ? "tour-dot-active" : "tour-dot-inactive"
        }" data-step="${i}"></span>`;
      }

      // Set tooltip content
      this.tooltipElement.innerHTML = "";
      this.tooltipElement.innerHTML = `
      <div class="tour-close" aria-label="Close tour">&times;</div>
      <div class="tour-title">${
        step.title || `Step ${stepIndex + 1} of ${this.steps.length}`
      }</div>
      <div class="tour-description">${step.description || ""}</div>
      <div class="tour-dots">${dotsHTML}</div>
      <div class="tour-buttons">
        <button class="tour-btn tour-btn-prev" ${
          isFirstStep ? "disabled" : ""
        }>Previous</button>
        <button class="tour-btn tour-btn-next">${
          isLastStep ? "Finish" : "Next"
        }</button>
      </div>
    `;

      // Add event listeners
      setTimeout(() => {
        // Close button
        const closeBtn = this.tooltipElement.querySelector(".tour-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", this.end);
        }

        // Previous button
        const prevButton = this.tooltipElement.querySelector(".tour-btn-prev");
        if (prevButton) {
          prevButton.addEventListener("click", () => {
            if (!isFirstStep) this.prev();
          });
        }

        // Next button
        const nextButton = this.tooltipElement.querySelector(".tour-btn-next");
        if (nextButton) {
          nextButton.addEventListener("click", () => {
            this.next();
          });
        }

        // Step dots
        const dots = this.tooltipElement.querySelectorAll(".tour-dot");
        dots.forEach((dot) => {
          dot.addEventListener("click", (e) => {
            const stepIndexDot = parseInt(e.target.getAttribute("data-step"));
            this.showStep(stepIndexDot);
          });
        });
      }, 0);
    }

    updateSpotlightPosition(
      element,
      {
        spotlightTop = 0,
        spotlightLeft = 0,
        spotlightWidth = 0,
        spotlightHeight = 0,
      } = {}
    ) {
      const rect = element.getBoundingClientRect();
      Object.assign(this.spotlight.style, {
        top: `${rect.top + spotlightTop - spotlightHeight / 2}px`,
        left: `${rect.left + spotlightLeft - spotlightWidth / 2}px`,
        width: `${rect.width + spotlightWidth}px`,
        height: `${rect.height + spotlightHeight}px`,
      });
    }

    positionTooltip(targetRect, { tooltipTop = 0, tooltipLeft = 0 } = {}) {
      const tooltipWidth = 300;
      const tooltipHeight = 150;
      const margin = 10;

      // Initial position below the element
      let top = targetRect.bottom + margin;
      let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

      // Adjust vertically if it overflows the bottom of the viewport
      if (top + tooltipHeight > window.innerHeight) {
        top = targetRect.top - tooltipHeight - margin;
      }
      if (top + tooltipHeight < 0) {
        top = 20;
      }

      // Adjust horizontally if it overflows the right side
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - margin;
      }

      // Adjust if it overflows the left side
      if (left < 0) {
        left = margin;
      }

      // Final apply to tooltip
      Object.assign(this.tooltipElement.style, {
        top: `${top + tooltipTop}px`,
        left: `${left + tooltipLeft}px`,
        transform: `translateX(0%)`,
      });
    }

    next = () => {
      if (this.currentStep < this.steps.length - 1) {
        this.showStep(this.currentStep + 1);
      } else {
        this.end();
      }
    };
    prev = () => {
      if (this.currentStep > 0 && this.currentStep > this.stepToStart) {
        this.showStep(this.currentStep - 1);
      }
    };

    end = () => {
      if (!this.isActive) return;
      // Click on button if active
      if (this.lastActiveButton) {
        this.activateButton(this.steps[this.lastStep]);
      }
      // Remove elements
      if (this.overlay && this.overlay.parentNode) this.overlay.remove();
      if (this.spotlight && this.spotlight.parentNode) this.spotlight.remove();
      if (this.tooltipElement && this.tooltipElement.parentNode)
        this.tooltipElement.remove();
      this.scrollToTop();
      // Restore scrolling
      document.body.style.overflow = this.originalOverflowStyle;

      // Remove event listeners
      this.enableScroll();
      document.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("resize", this.handleResize);
      this.tooltipElement.removeEventListener("click", (e) => {
        if (e.target.id === "show-lightbox-show") {
          this.end();
          this.openGalery();
        }
      });
      // Clear any pending timeouts
      if (this.scrollLockTimeout) {
        clearTimeout(this.scrollLockTimeout);
      }
      document.querySelector("style.tour-style").remove();
      this.isActive = false;
    };
    activateButton(step) {
      return new Promise((resolve) => {
        if (step.activateButton) {
          const button = document.querySelector(step.activateButton);
          if (button) button.click();
        }
        setTimeout(resolve, 500);
      });
    }
    disableScroll() {
      window.addEventListener("wheel", this.preventScroll, {
        passive: false,
      });
      window.addEventListener("keydown", this.preventKeyScroll, {
        passive: false,
      });
    }
    enableScroll() {
      window.removeEventListener("wheel", this.preventScroll);
      window.removeEventListener("keydown", this.preventKeyScroll);
    }

    preventScroll(e) {
      e.preventDefault();
    }

    preventKeyScroll(e) {
      const keys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // space, page up/down, arrows
      if (keys.includes(e.keyCode)) {
        e.preventDefault();
      }
    }
  }

  function startTour() {
    createTourStyle();
    let stepToStart = localStorage.getItem("myKey") || 3;
    const tour = new WebPageTour(
      [
        {
          title: "Welcome to our site",
          description:
            "After You logeed in, You willarrive at your dashboard page that looks some like this. This page displays some useful account information.",
        },
        {
          element: ".account-btn",
          title: "Flyout menu access button",
          description:
            "By clicking on this button you wil reveal a flyout menu with lots more account features.",
          click_listener: true,
          adjust_spotlight: { width: 10, height: 10 },
        },
        {
          element: ".customertools",
          title: "Flyout menu",
          description:
            " Study these in your own time. The main sections you may wish to visit are...",
          activateButton: ".account-btn",
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          element: ".sidebar-myorders",
          title: "Orders section",
          description:
            "By clicking on this link you'll have access to all your order's details",
          activateButton: ".account-btn",
          fixed_element: ".customertools",
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          element: ".sidebar-myaccountoverview",
          title: "Account overview section",
          description:
            "By activationg this link you'll reveal a consolidated view of your account.",
          activateButton: ".account-btn",
          fixed_element: ".customertools",
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          element: ".sidebar-myinvoice",
          title: "Invoice history section",
          description: "The following option takes you to the Invoice Section",
          activateButton: ".account-btn",
          fixed_element: ".customertools",
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          element: "button.btn-outlined:nth-child(2)",
          title: "Switch account",
          description:
            "If you ever need to switch accounts or Jobs you can do so here...",
          activateButton: ".account-btn",
          fixed_element: ".customertools",
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          element: ".switch-account-header",
          title: "Switch account",
          description: "...or  you can also switch your account here.",
          adjust_spotlight: { height: 10 },
        },
        {
          element: ".sidebar-myorders",
          title: "Orders section",
          description:
            "Let's look at the order section. Click on 'Orders' button",
          activateButton: ".account-btn",
          fixed_element: ".customertools",
          click_listener: true,
          adjust_tooltip: {
            left: -280,
          },
        },
        {
          title: "Thank you",
          description:
            "If you want some more information about the platform please <a id='show-lightbox-show'>click here<a/>",
        },
      ],
      stepToStart
    );
    tour.start();
  }
  //document.addEventListener("DOMContentLoaded", () => {
  startTour();
  //});
})();
