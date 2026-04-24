    const slides = Array.from(document.querySelectorAll(".slide"));
    const sidebarList = document.getElementById("sidebarList");
    const currentTitle = document.getElementById("currentSlideTitle");
    const currentEl = document.querySelector("[data-current]");
    const totalEl = document.querySelector("[data-total]");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const progressBar = document.getElementById("progressBar");
    const stage = document.querySelector(".stage");
    const galleries = Array.from(document.querySelectorAll("[data-gallery]"));
    const lightbox = document.getElementById("lightbox");
    stage.appendChild(lightbox);
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");
    const lightboxDots = document.getElementById("lightboxDots");
    const lightboxState = {
      items: [],
      index: 0,
    };
    const slideViewport = {
      width: 1280,
      height: 720,
      margin: 0.985,
    };

    totalEl.textContent = String(slides.length);

    function updateSlideScale() {
      const stageWidth = stage.clientWidth;
      const stageHeight = stage.clientHeight;
      if (!stageWidth || !stageHeight) {
        return;
      }
      const scale = Math.min(
        stageWidth / slideViewport.width,
        stageHeight / slideViewport.height,
      ) * slideViewport.margin;
      stage.style.setProperty("--slide-scale", String(Math.max(scale, 0.1)));
    }

    /* Module icon map for sidebar */
    const moduleIcons = {
      "第一部分：认识 OpenClaw": "compass",
      "第二部分：基本原理": "network",
      "第三部分：部署思路": "route",
      "第四部分：现场部署": "server",
      "第五部分：飞书接入": "message-circle",
      "第六部分：Skills 配置": "puzzle",
      "第七部分：案例实战": "lightbulb",
    };

    slides.forEach((slide, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "sidebar-item";
      item.dataset.index = String(index);
      item.dataset.module = slide.dataset.module;
      const iconName = moduleIcons[slide.dataset.module] || "file";
      const isFirstInModule = index === 0 || slides[index - 1].dataset.module !== slide.dataset.module;
      const iconHtml = isFirstInModule ? `<i data-lucide="${iconName}" style="width:13px;height:13px;display:inline-block;vertical-align:-1px;margin-right:3px;opacity:0.6;"></i>` : "";
      item.innerHTML = `<span>${iconHtml}${slide.dataset.module}</span><strong>${index + 1}. ${slide.dataset.title}</strong>`;
      item.addEventListener("click", () => goToSlide(index));
      sidebarList.appendChild(item);
    });

    const sidebarItems = Array.from(document.querySelectorAll(".sidebar-item"));
    let currentIndex = 0;

    function updateHash(index) {
      history.replaceState(null, "", `#slide-${index + 1}`);
    }

    function renderSlide(index) {
      currentIndex = index;
      slides.forEach((slide, slideIndex) => {
        slide.hidden = slideIndex !== index;
        slide.classList.toggle("active", slideIndex === index);
      });
      sidebarItems.forEach((item, itemIndex) => {
        item.classList.toggle("active", itemIndex === index);
      });
      currentEl.textContent = String(index + 1);
      currentTitle.textContent = slides[index].dataset.title;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === slides.length - 1;
      // Update progress bar
      const pct = ((index + 1) / slides.length) * 100;
      progressBar.style.width = pct + "%";
      // Update progress bar color to match current module
      const moduleColor = slides[index].style.getPropertyValue("--module") || getComputedStyle(slides[index]).getPropertyValue("--module") || "#b45309";
      progressBar.style.background = `linear-gradient(90deg, ${moduleColor}, ${moduleColor}88)`;
      const activeItem = sidebarItems[index];
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
      updateSlideScale();
      updateHash(index);
    }

    function goToSlide(index) {
      if (index < 0 || index >= slides.length) {
        return;
      }
      renderSlide(index);
    }

    function initFromHash() {
      const matched = window.location.hash.match(/slide-(\d+)/);
      if (!matched) {
        renderSlide(0);
        return;
      }
      const target = Number.parseInt(matched[1], 10) - 1;
      if (Number.isNaN(target)) {
        renderSlide(0);
        return;
      }
      renderSlide(Math.min(Math.max(target, 0), slides.length - 1));
    }

    function initGallery(gallery) {
      const panels = Array.from(gallery.querySelectorAll(".gallery-panel"));
      const dots = Array.from(gallery.querySelectorAll(".gallery-dot"));
      const prev = gallery.querySelector(".gallery-nav.prev");
      const next = gallery.querySelector(".gallery-nav.next");
      const jumpScope = gallery.closest("[data-segment-panel]") || gallery.closest(".slide") || gallery;
      const jumpButtons = Array.from(jumpScope.querySelectorAll("[data-gallery-jump]"));
      let galleryIndex = 0;

      if (!panels.length) {
        return;
      }

      function renderGallery(index) {
        galleryIndex = (index + panels.length) % panels.length;
        panels.forEach((panel, panelIndex) => {
          panel.hidden = panelIndex !== galleryIndex;
        });
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle("active", dotIndex === galleryIndex);
        });
        jumpButtons.forEach((button) => {
          const targetIndex = Number.parseInt(button.dataset.galleryJump || "", 10);
          button.classList.toggle("active", Number.isInteger(targetIndex) && targetIndex === galleryIndex);
        });
      }

      prev?.addEventListener("click", () => renderGallery(galleryIndex - 1));
      next?.addEventListener("click", () => renderGallery(galleryIndex + 1));
      dots.forEach((dot, dotIndex) => {
        dot.addEventListener("click", () => renderGallery(dotIndex));
      });
      jumpButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const targetIndex = Number.parseInt(button.dataset.galleryJump || "", 10);
          if (!Number.isInteger(targetIndex)) {
            return;
          }
          renderGallery(targetIndex);
        });
      });

      renderGallery(0);
    }

    function initSegmented(container) {
      const buttons = Array.from(container.querySelectorAll("[data-segment-btn]"));
      const panels = Array.from(container.querySelectorAll("[data-segment-panel]"));
      if (!buttons.length || !panels.length) {
        return;
      }

      function renderSegment(key) {
        buttons.forEach((button) => {
          const active = button.dataset.segmentBtn === key;
          button.classList.toggle("active", active);
          button.setAttribute("aria-selected", String(active));
          button.tabIndex = active ? 0 : -1;
        });

        panels.forEach((panel) => {
          panel.hidden = panel.dataset.segmentPanel !== key;
        });
      }

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          renderSegment(button.dataset.segmentBtn);
        });
      });

      const defaultButton = buttons.find((button) => button.hasAttribute("data-default")) || buttons[0];
      renderSegment(defaultButton.dataset.segmentBtn);
    }

    function renderLightbox() {
      const item = lightboxState.items[lightboxState.index];
      if (!item) {
        return;
      }
      lightboxImage.src = item.src;
      lightboxImage.alt = item.alt;
      lightboxCaption.textContent = item.caption;
      lightboxPrev.hidden = lightboxState.items.length <= 1;
      lightboxNext.hidden = lightboxState.items.length <= 1;
      lightboxDots.innerHTML = "";
      lightboxState.items.forEach((entry, entryIndex) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "lightbox-dot";
        dot.textContent = entry.label;
        dot.classList.toggle("active", entryIndex === lightboxState.index);
        dot.addEventListener("click", () => {
          lightboxState.index = entryIndex;
          renderLightbox();
        });
        lightboxDots.appendChild(dot);
      });
    }

    function stepLightbox(delta) {
      if (lightboxState.items.length <= 1) {
        return;
      }
      lightboxState.index = (lightboxState.index + delta + lightboxState.items.length) % lightboxState.items.length;
      renderLightbox();
    }

    function openLightbox(image) {
      const gallery = image.closest("[data-gallery]");
      if (gallery) {
        const panels = Array.from(gallery.querySelectorAll(".gallery-panel"));
        const labels = Array.from(gallery.querySelectorAll(".gallery-dot")).map((dot) => dot.textContent.trim());
        lightboxState.items = panels.map((panel, panelIndex) => {
          const panelImage = panel.querySelector("img");
          const panelCaption = panel.querySelector("figcaption")?.textContent || panelImage.alt || "";
          return {
            src: panelImage.currentSrc || panelImage.src,
            alt: panelImage.alt || "",
            caption: panelCaption,
            label: labels[panelIndex] || `${panelIndex + 1}`,
          };
        });
        lightboxState.index = panels.findIndex((panel) => panel.contains(image));
      } else {
        const caption = image.closest("figure")?.querySelector("figcaption")?.textContent || image.alt || "";
        lightboxState.items = [{
          src: image.currentSrc || image.src,
          alt: image.alt || "",
          caption,
          label: "当前图片",
        }];
        lightboxState.index = 0;
      }
      renderLightbox();
      lightbox.classList.add("open");
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightboxImage.src = "";
      lightboxImage.alt = "";
      lightboxCaption.textContent = "";
      lightboxDots.innerHTML = "";
      lightboxState.items = [];
      lightboxState.index = 0;
    }

    prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
    nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));

    stage.addEventListener("click", (event) => {
      if (document.fullscreenElement !== stage) {
        return;
      }
      if (lightbox.classList.contains("open")) {
        return;
      }
      if (event.target.closest("button, a, input, textarea, select, img, figure, .gallery-dots, .gallery-nav, .lightbox, .lightbox-inner")) {
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const midpoint = stageRect.left + stageRect.width / 2;
      if (event.clientX < midpoint) {
        goToSlide(currentIndex - 1);
        return;
      }
      if (event.clientX >= midpoint) {
        goToSlide(currentIndex + 1);
      }
    });

    fullscreenBtn.addEventListener("click", async () => {
      if (!document.fullscreenElement) {
        await stage.requestFullscreen();
        fullscreenBtn.textContent = "退出全屏";
      } else {
        await document.exitFullscreen();
        fullscreenBtn.textContent = "全屏";
      }
    });

    document.addEventListener("fullscreenchange", () => {
      fullscreenBtn.textContent = document.fullscreenElement ? "退出全屏" : "全屏";
      requestAnimationFrame(updateSlideScale);
    });

    window.addEventListener("resize", updateSlideScale);
    if ("ResizeObserver" in window) {
      new ResizeObserver(updateSlideScale).observe(stage);
    }

    document.addEventListener("keydown", (event) => {
      const blocked = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "");
      if (event.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
        return;
      }
      if (lightbox.classList.contains("open") && (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ")) {
        event.preventDefault();
        stepLightbox(1);
        return;
      }
      if (lightbox.classList.contains("open") && (event.key === "ArrowLeft" || event.key === "PageUp")) {
        event.preventDefault();
        stepLightbox(-1);
        return;
      }
      if (blocked) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        goToSlide(currentIndex + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goToSlide(currentIndex - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goToSlide(slides.length - 1);
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!document.fullscreenElement) {
          stage.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    });

    galleries.forEach(initGallery);
    Array.from(document.querySelectorAll("[data-segmented]")).forEach(initSegmented);
    Array.from(document.querySelectorAll("figure img")).forEach((image) => {
      image.addEventListener("click", () => openLightbox(image));
    });
    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrev.addEventListener("click", () => stepLightbox(-1));
    lightboxNext.addEventListener("click", () => stepLightbox(1));
    updateSlideScale();
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
    window.addEventListener("hashchange", initFromHash);
    /* Initialize Lucide icons */
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    initFromHash();
