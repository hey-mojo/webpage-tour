(() => {
  //if (!$(".ex-u-1864335").length) return;
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
    .bg-highlighted {
      background-color: rgb(251, 241, 210);
      font-weight: 500;
      font-size: 0.9rem;
      margin-top: 10px;
      display: block;
      padding: 3px 7px;
    }

  `;
    document.head.appendChild(style);
  }

  class WebPageTour {
    constructor(steps, stepToStart, localStorageName) {
      // filter elements what exist
      this.steps = steps.filter((step) => {
        return !step.element || document.querySelector(step.element);
      });
      // check stepTo Start and set current step
      this.currentStep =
        stepToStart <= steps.length && stepToStart > 0 ? stepToStart - 1 : 0;
      // set variable to form all steps
      this.stepToStart = 0;
      // set last step to know what step was last
      this.lastStep = this.currentStep;

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
      this.lastActiveSelect = null;
      this.inProgress = false;
      this.isSmallScreen = false;
      this.localStorageName = localStorageName;
      this.selectOptionsElement = null;

      // Bind methods to maintain 'this' context
      this.handleResize = this.handleResize.bind(this);
      this.activateButton = this.activateButton.bind(this);
      this.createSelectOptions = this.createSelectOptions.bind(this);
      this.waitForClassRemoval = this.waitForClassRemoval.bind(this);

      //complete objects
      const checkKeysString = ["activateButton"];
      const checkKeysBoolean = ["handle_select_click", "click_listener"];
      checkKeysString.forEach((e) => {
        this.steps.forEach((obj) => (obj[e] ??= ""));
      });
      checkKeysBoolean.forEach((e) => {
        this.steps.forEach((obj) => (obj[e] ??= false));
      });
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
          src: "https://cdn.jsdelivr.net/gh/hey-mojo/webpage-tour/public/images/slide_Page_01.jpg",
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
          "To use our tour, please resize your window or use desktop";
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
        if (this.selectOptionsElement) {
          this.positionSelectOption();
        }
      }
    }

    async showStep(stepIndex) {
      if (this.inProgress) return;
      this.inProgress = true;
      this.currentStep = stepIndex;

      // check if this is the first run of the first step
      const isFirstRun = this.currentStep === this.lastStep;

      // Clear tooltip style
      this.tooltipElement.style = "";

      // Remove Event Listener to tooltip if this is not first Run
      if (this.steps[this.lastStep].click_listener && !isFirstRun) {
        this.spotlight.classList.remove("tour-spotlight-cursor");
        this.spotlight.removeEventListener("click", () => {
          this.next();
        });
      }
      if (this.steps[this.lastStep].handle_select_click) {
        this.selectOptionsElement.remove();
        this.selectOptionsElement = null;
      }
      if (
        (this.steps[this.currentStep].handle_select_click &&
          this.steps[this.currentStep].activateButton) ||
        (this.steps[this.currentStep].activate_button_option &&
          this.steps[this.currentStep].activateButton)
      ) {
        const select = document.querySelector(
          this.steps[this.currentStep].activateButton
        );
        select.selectedIndex =
          this.steps[this.currentStep].activate_button_option - 1;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }

      this.lastActiveButton = this.steps[this.lastStep].activateButton;
      const currentBtn = this.steps[this.currentStep].activateButton;
      const isBtnActive = this.lastActiveButton === currentBtn;

      this.lastActiveSelect = this.steps[this.lastStep].handle_select_click;
      const ishandle_select_click =
        this.steps[this.currentStep].handle_select_click;

      // Deactivate the button from last step if there is one and it is not the same as cu3rrent one and activate one if there is "activateButton" option. isBtnActive shows that we don't need to adjust spotlight because current element is active and no transition

      //if we have button activated from last step and we have button to activate on this step and they are different and it is not select element
      if (this.lastActiveButton && currentBtn && !isBtnActive) {
        if (!this.lastActiveSelect) {
          this.activateButton(this.steps[this.lastStep]);
        }
        if (!ishandle_select_click) {
          await this.activateButton(this.steps[this.currentStep]);
        }
      } else if (
        (!this.lastActiveButton && currentBtn) ||
        (isFirstRun && currentBtn)
      ) {
        if (!ishandle_select_click) {
          await this.activateButton(this.steps[this.currentStep]);
        }
      } else if (this.lastActiveButton && !currentBtn) {
        if (!this.lastActiveSelect) {
          this.activateButton(this.steps[this.lastStep]);
        }
      }

      if (!ishandle_select_click) {
        this.lastActiveButton = currentBtn;
      } else if (ishandle_select_click) {
        this.createSelectOptions(this.steps[this.currentStep].element);
        this.lastActiveSelect = currentBtn;
      }

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
        if (this.selectOptionsElement) {
          element =
            this.selectOptionsElement.querySelectorAll("div")[
              step.select_option - 1
            ];
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
      //assign style to the tooltip
      if (this.steps[this.currentStep].tooltip_style) {
        Object.assign(
          this.tooltipElement.style,
          this.steps[this.currentStep].tooltip_style
        );
      }
      // Add Event Listener to tooltip
      if (this.steps[this.currentStep].click_listener) {
        this.spotlight.classList.add("tour-spotlight-cursor");
        this.spotlight.addEventListener("click", () => {
          this.next();
        });
      }

      if (
        this.steps[this.currentStep].await_class_removal &&
        this.steps[this.currentStep].await_element
      ) {
        const buttonsTour = document.querySelectorAll(".tour-buttons button");
        const originalStates = Array.from(buttonsTour).map(
          (btn) => btn.disabled
        );
        buttonsTour.forEach((btn) => (btn.disabled = true));
        await this.waitForClassRemoval(
          this.steps[this.currentStep].await_element,
          this.steps[this.currentStep].await_class_removal
        );
        buttonsTour.forEach((btn, i) => {
          btn.disabled = originalStates[i];
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
        this.end(this.localStorageName);
      }
    };
    prev = () => {
      if (this.currentStep > 0 && this.currentStep > this.stepToStart) {
        this.showStep(this.currentStep - 1);
      }
    };

    end = (recordLocaleStorage = "") => {
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
      if (recordLocaleStorage) {
        window.localStorage.setItem(recordLocaleStorage, "true");
      }
      // Clear createdElement
      if (this.selectOptionsElement) {
        this.selectOptionsElement.remove();
      }
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
    positionSelectOption() {
      const rect = document
        .querySelector(this.steps[this.currentStep].element)
        .getBoundingClientRect();
      this.selectOptionsElement.style.left = rect.left + window.scrollX + "px";
      this.selectOptionsElement.style.top =
        rect.top + rect.height + window.scrollY + 2 + "px";
      this.selectOptionsElement.style.width = rect.width + "px";
    }
    createSelectOptions(element) {
      const select = document.querySelector(element);

      // Get all computed styles from the original select
      const computed = window.getComputedStyle(select);

      // Create visual container
      const visualDropdown = document.createElement("div");
      visualDropdown.style.position = "absolute";

      // Copy important visual styles
      visualDropdown.style.minWidth = "150px";
      visualDropdown.style.background = "#eee";
      visualDropdown.style.borderRadius = "5px";
      visualDropdown.style.color = computed.color;
      visualDropdown.style.font = computed.font;
      visualDropdown.style.padding = computed.padding;
      visualDropdown.style.boxShadow =
        "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;";
      visualDropdown.style.border = "1px solid #ccc";

      // Add each option as a visual item
      Array.from(select.options).forEach((option) => {
        const optionDiv = document.createElement("div");
        optionDiv.textContent = option.text;

        // Copy the option style (basic text style)
        optionDiv.style.padding = "6px 8px";
        optionDiv.style.color = computed.color;
        optionDiv.style.font = computed.font;
        optionDiv.style.background = "#eee";
        optionDiv.style.borderBottom = "1px solid #ddd";

        visualDropdown.appendChild(optionDiv);
      });

      // assign to select element
      this.selectOptionsElement = visualDropdown;
      //position element
      this.positionSelectOption();
      // Add to document
      document.body.appendChild(visualDropdown);
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
    waitForClassRemoval(selector, className) {
      return new Promise((resolve) => {
        const el = document.querySelector(selector);

        if (!el) return resolve(el);
        // If element is already without the class, resolve immediately
        if (el && !el.classList.contains(className)) {
          return resolve(el);
        }

        // Watch for class changes
        const observer = new MutationObserver(() => {
          if (!el.classList.contains(className)) {
            observer.disconnect();
            resolve(el);
          }
        });

        observer.observe(el, { attributes: true, attributeFilter: ["class"] });
      });
    }
  }

  function startTour_1() {
    createTourStyle();
    let stepToStart = localStorage.getItem("stepToStartTour") || 1;
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
            top: -50,
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
          title: "Thank you",
          description:
            "If you want some more information about the platform please <a id='show-lightbox-show'>click here<a/>",
        },
      ],
      stepToStart,
      "isDashboardTourDone"
    );
    tour.start();
  }
  function startTour_2() {
    createTourStyle();
    let stepToStart = localStorage.getItem("stepToStartTour") || 1;
    const tour = new WebPageTour(
      [
        {
          title: "Welcome to your Account Overview page",
          description: "Need to make some text for this section.",
        },
        {
          element: ".account-summary-select",
          title: "This will reveal a consolidated view of your account",
          description: "By clicking on this button you wil reveal a selector.",
          click_listener: true,
        },
        {
          element: ".account-summary-select",
          title: "Job selector",
          description:
            "After you click on 'Job 0' the dropdown selector will be revealed. Click on it",
          handle_select_click: true,
          select_option: 2,
          click_listener: true,
        },
        {
          element: "#account_0 .account-balance-select",
          title: "Reveal all accounts",
          description:
            "Clicking on the 'Account Consolidated' dropdown will reveal details of your individual jobs while the consolidated vies is a total of all jobs together. Click on the first item after 'Account consolidated'.",
          click_listener: true,
          activateButton: ".account-summary-select",
          activate_button_option: 2,
          tooltip_style: {
            maxWidth: "500px",
          },
          adjust_tooltip: { left: -100 },
        },
        {
          element: "#account_0 .account-balance-select",
          title: "Outstanding amount",
          description: "This selector will show you Outstanding amount.",
          activateButton: ".account-summary-select",
          activate_button_option: 2,
          handle_select_click: true,
          select_option: 1,
          click_listener: true,
        },
        {
          element: "#account_0 .account-balance-select",
          title: "Last statement balance",
          description: "This selector will show you Last statement balance.",
          activateButton: ".account-summary-select",
          activate_button_option: 2,
          handle_select_click: true,
          select_option: 2,
          click_listener: true,
        },
        {
          title: "Account Balance",
          description:
            "The 'Make A Payment' button will take you to the payment screen based on which oprion is selected. Either 'Outstanding Amount (this includes, open incoices from last statement and current new changes) or 'Last Statement'",
          element: "#make-payment-0 > a",
          click_listener: true,
          activateButton: "#account_0 .account-balance-select",
          activate_button_option: 2,
          adjust_tooltip: { top: -160 },
        },
        {
          element: "#account_0 .account-balance-select",
          title: "Reveal all accounts",
          description: "Click here agian and choose Select Invoices.",
          click_listener: true,
          activateButton: ".account-summary-select",
          activate_button_option: 2,
        },
        {
          element: "#account_0 .select-invoices > a",
          title: "Select Invoices",
          description:
            "This selector will reveal button which will take you to the invoices page.",
          activateButton: "#account_0 .account-balance-select",
          activate_button_option: 3,
          click_listener: true,
        },

        {
          element: ".accountOverviewInvoices",
          title: "Invoices",
          description: "You can also get to Invoices by clicking here.",
          click_listener: true,
        },

        {
          element: ".sidebar-myinvoice",
          title: "Invoice History",
          description: "Or on your flyout menu.",
          click_listener: true,
          activateButton: ".account-btn",
          adjust_tooltip: {
            left: -250,
            top: 20,
          },
        },
        {
          title: "Thank you",
          description:
            "If you want some more information about the platform please <a id='show-lightbox-show'>click here<a/>",
        },
      ],
      stepToStart,
      "isAccountOverviewTourDone"
    );
    tour.start();
  }
  function startTour_3() {
    createTourStyle();
    let stepToStart = localStorage.getItem("stepToStartTour") || 1;
    const tour = new WebPageTour(
      [
        {
          title: "Welcome to your Invoices page",
          description:
            "The section allows you to view all invoices associated with your accoount",
          activateButton: ".job select",
          activate_button_option: 1,
          await_element: ".myaccount.container.invoices",
          await_class_removal: "loading",
        },
        {
          element: ".job select",
          title: "All Accounts",
          description:
            "Selecting the 'All Accounts' will reveal a consolidated view of all invoices across all jobs.",
          click_listener: true,
        },
        {
          element: ".job select",
          title: "Use Job 0 for the example.",
          description:
            'After you click on "Job 0" you can see all invoices for this account. <span class="bg-highlighted"><b>Notice</b> that navigation buttons will be enabled after data loads.</span>',
          activateButton: ".job select",
          activate_button_option: 2,
          handle_select_click: true,
          select_option: 2,
          click_listener: true,
          await_element: ".myaccount.container.invoices",
          await_class_removal: "loading",
          adjust_tooltip: {
            top: -50,
            left: -250,
          },
        },
        {
          element: ".invoice-checkbox-all",
          title: "Pay invoices",
          description:
            "In this column you can choose which option you wish to pay or check the box to select all.",
          click_listener: true,
        },
        {
          element: "td:has(.invoice-checkbox)",
          title: "Individal checkbox payment",
          description:
            "You can click on this check box to activate the payment button.",
          click_listener: true,
        },
        {
          element: ".invoices-pay-now > a",
          title: "Pay Now Button",
          description:
            'This button will be activated if you chose any option. <span class="bg-highlighted"><b>Notice</b> that by selecting all unpaid invoices the system will total them together.</span>',
          click_listener: true,
          activateButton: ".invoice-checkbox",
        },
        {
          element: ".paymentStatus",
          title: "Payment Status",
          description:
            'In this column you will see your invoices status. <span class="bg-highlighted"><b>Notice</b> that filtering by "Status" is currently unavailable.</span>',
        },
        {
          element: "tr:has(.invoice-checkbox) td:not([class]):has(span)",
          title: "Payment Status",
          description:
            '<span class="bg-highlighted"><b>Notice</b> that all unpaid invoices are also revealed.</span>',
        },
        {
          title: "Thank you",
          description:
            "If you want some more information about the platform please <a id='show-lightbox-show'>click here<a/>",
        },
      ],
      stepToStart,
      "isInvoicesTourDone"
    );
    tour.start();
  }
  //document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.pathname === "/myaccount" &&
    !(window.localStorage.getItem("isDashboardTourDone") === "true")
  ) {
    if (!document.querySelector(".tour-start")) {
      const targetElement = document.querySelector(".myaccount-grid-title");
      const divEl = document.createElement("div");
      divEl.classList.add("tour-start");
      divEl.style =
        "margin-left: 20px; display: flex; justify-content: center; align-items: center;";
      anchorEl = document.createElement("a");
      anchorEl.classList.add("tour-start-btn");
      anchorEl.href = "javascript:;";
      anchorEl.style =
        "background-color: rgb(251, 241, 210); font-weight: 500; font-size: 0.9rem; display: block; padding: 10px 15px;";
      anchorEl.textContent = "Start Webtour";
      anchorEl.addEventListener("click", () => {
        startTour_1();
      });
      divEl.append(anchorEl);
      targetElement.append(divEl);
    }
    startTour_1();
  }
  if (
    window.location.pathname.startsWith("/customer/account-overview") &&
    !(window.localStorage.getItem("isAccountOverviewTourDone") === "true")
  ) {
    if (!document.querySelector(".tour-start")) {
      const targetElement = document.querySelector(".nav-pills");
      const listEl = document.createElement("li");
      listEl.classList.add("tour-start");
      anchorEl = document.createElement("a");
      anchorEl.classList.add("tour-start-btn");
      anchorEl.href = "javascript:;";
      anchorEl.style =
        "background-color: rgb(251, 241, 210); font-weight: 500; font-size: 0.9rem; display: block;";
      anchorEl.textContent = "Start Webtour";
      anchorEl.addEventListener("click", () => {
        startTour_2();
      });
      listEl.append(anchorEl);
      targetElement.append(listEl);
    }
    startTour_2();
  }
  if (
    window.location.pathname.startsWith("/customer/invoices") &&
    !window.location.pathname.startsWith("/customer/invoices/pay") &&
    !(window.localStorage.getItem("isInvoicesTourDone") === "true")
  ) {
    if (!document.querySelector(".tour-start")) {
      const targetElement = document.querySelector(".nav-pills");
      const listEl = document.createElement("li");
      listEl.classList.add("tour-start");
      anchorEl = document.createElement("a");
      anchorEl.classList.add("tour-start-btn");
      anchorEl.href = "javascript:;";
      anchorEl.style =
        "background-color: rgb(251, 241, 210); font-weight: 500; font-size: 0.9rem; display: block;";
      anchorEl.textContent = "Start Webtour";
      anchorEl.addEventListener("click", () => {
        startTour_3();
      });
      listEl.append(anchorEl);
      targetElement.append(listEl);
    }
    startTour_3();
  }
  //});
})();
