Promise.all([
    fetch("header.html").then(res => res.text()),
    fetch("footer.html").then(res => res.text()),
    fetch("sidebar.html").then(res => res.text()),
    fetch("search-form.html").then(res => res.text())
  ])
  .then(([headerHTML, footerHTML, sidebarHTML, searchHTML]) => {
    $("#header").html(headerHTML);
    $("#footer").html(footerHTML);
    $("#sidebar").html(sidebarHTML);
    $("#edit-sidebar").html(sidebarHTML);
    $("#search-form-container").html(searchHTML);
  })
  .then(() => {
    initBannerVideo();
    initNavLink();
    initSidebar();
    initEditSidebar();
    initSidebarDropdown();
    initCounter();
    initThemeSwitch();
    initSearchBar();
    initSubmitContact();
    initSubmitNewsletter();
    initAnimateData();
  });
      
function initBannerVideo() {
    var player;

    var $tag = $('<script>', { src: "https://www.youtube.com/iframe_api" });
    $('script').first().before($tag);

    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('banner-video-background', {
            videoId: 'P68V3iH4TeE',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'mute': 1,
                'loop': 1,
                'playlist': 'P68V3iH4TeE',
                'showinfo': 0,
                'rel': 0,
                'enablejsapi': 1,
                'disablekb': 1,
                'modestbranding': 1,
                'iv_load_policy': 3,
                'origin': window.location.origin
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function onPlayerReady(event) {
        event.target.playVideo();
        setYoutubeSize();
        $(window).on('resize', setYoutubeSize);
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            player.playVideo();
        }
    }

    function setYoutubeSize() {
        var $container = $('.banner-video-container');
        var containerWidth = $container.outerWidth();
        var containerHeight = $container.outerHeight();
        var aspectRatio = 16 / 9;
        var newWidth, newHeight;

        if (containerWidth / containerHeight > aspectRatio) {
            newWidth = containerWidth;
            newHeight = containerWidth / aspectRatio;
        } else {
            newWidth = containerHeight * aspectRatio;
            newHeight = containerHeight;
        }

        if (player && player.getIframe) {
            var $iframe = $(player.getIframe());
            $iframe.width(newWidth).height(newHeight);
        }
    }

    function handleYouTubeErrors() {
        window.addEventListener('message', function(event) {
            if (event.origin !== 'https://www.youtube.com/') return;
        
            try {
                var data = JSON.parse(event.data);
               
            } catch (e) {
     
            }
        });
    }
}

function initThemeSwitch() {
    let lightMode = false;

    if (localStorage.getItem('lightmode') === 'active') {
        lightMode = true;
        $('body').addClass('lightmode');
    }

    const updateLogos = () => {
        const siteLogos = $('.site-logo');
        const partnerLogos = $('.partner-logo');

        if (lightMode) {
            $('body').addClass('lightmode');
            localStorage.setItem('lightmode', 'active');

            siteLogos.attr('src', 'image/digiencylogo.png');

            partnerLogos.each(function () {
                const $img = $(this);
                const src = $img.attr('src');
                if (!src.includes('-dark')) {
                    $img.attr('src', src.replace('.png', '-dark.html'));
                }
            });
        } else {
            $('body').removeClass('lightmode');
            localStorage.removeItem('lightmode');

            siteLogos.attr('src', 'image/digiencylogow.png');

            partnerLogos.each(function () {
                const $img = $(this);
                const src = $img.attr('src');
                $img.attr('src', src.replace('-dark.html', '.png'));
            });
        }
    };

    updateLogos();

    const observer = new MutationObserver(() => {
        updateLogos();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    $('#themeSwitch').on('click', function () {
        lightMode = !lightMode;
        updateLogos();

        const iconClass = lightMode ? 'fa-sun' : 'fa-moon';
        $('#themeIcon')
            .removeClass('fa-sun fa-moon')
            .addClass(iconClass);
    });
}



$(document).ready(function() {
    initThemeSwitch();
});

function initCounter() {
    var $counters = $(".counter");

    function updateCount($counter) {
        var target = +$counter.data("target");
        var count = +$counter.text().replace("+", "");
        var duration = 2000; 
        var steps = 60;
        var increment = Math.max(1, Math.ceil(target / steps));
        var delay = Math.floor(duration / (target / increment));

        if (count < target) {
            var nextCount = Math.min(target, count + increment);
            $counter.text(nextCount);
            setTimeout(function() {
                updateCount($counter);
            }, delay);
        } else {
            $counter.text(target);
        }
    }

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var $counter = $(entry.target);
                updateCount($counter);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    $counters.each(function() {
        observer.observe(this);
    });
}

function initNavLink() {
    const currentUrl = window.location.href;
    $(".navbar-nav .nav-link").each(function() {
        if (this.href === currentUrl) {
            $(this).addClass("active");
        }
    });
    $(".navbar-nav .dropdown-menu .dropdown-item").each(function() {
        if (this.href === currentUrl) {
            $(this).closest(".dropdown").find(".nav-link.dropdown-toggle").addClass("active");
        }
    });
}

$(function(){
    const elements = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add(entry.target.getAttribute('data-animate'));
                    entry.target.style.opacity = 1;
    
                    observer.unobserve(entry.target);
                }, delay);
            }
        });
    }, {
        threshold: 0.1
    });
    elements.forEach(el => observer.observe(el));    
});

function initSidebar() {
    const $menuBtn = $('.nav-btn');
    const $closeBtn = $('.close-btn');
    const $overlay = $('.sidebar-overlay');
    const $sidebar = $('.sidebar');
  
    $menuBtn.click(function() {
      $overlay.addClass('active');
      setTimeout(() => {
        $sidebar.addClass('active');
      }, 200);
    });
  
    $closeBtn.click(function() {
      $sidebar.removeClass('active');
      setTimeout(() => {
        $overlay.removeClass('active');
      }, 200);
    });
  
    $overlay.click(function() {
      $sidebar.removeClass('active');
      setTimeout(() => {
        $overlay.removeClass('active');
      }, 200);
    });
  }

function initEditSidebar() {
    const $contentBtn = $('.content-edit');
    const $closeBtn = $('.close-btn-second');
    const $overlay = $('.content-overlay');
    const $sidebar = $('.content-edit-sidebar');

    $contentBtn.click(function() {
        $sidebar.addClass('active');
        setTimeout(() => {
            $overlay.addClass('active');    
        }, 200);
    });

    $closeBtn.click(function() {
        $sidebar.removeClass('active');
        setTimeout(() => {
            $overlay.removeClass('active');
        }, 200);
    });
}

function initSidebarDropdown() {
    const $dropdownButtons = $(".sidebar-dropdown-btn");

    $dropdownButtons.each(function() {
        $(this).on("click", function() {
            const $dropdownMenu = $(this).parent().next(".sidebar-dropdown-menu");
            const isOpen = $dropdownMenu.hasClass("active");

            $(".sidebar-dropdown-menu").not($dropdownMenu).removeClass("active");

            $dropdownMenu.toggleClass("active", !isOpen);
        });
    });
}


function initSearchBar() {
    const $searchBtn = $(".search-btn");
    const $overlay = $(".search-overlay");
    const $closeBtn = $(".search-close");
  
    if ($overlay.length === 0) return;
  
    $searchBtn.on("click", function () {
      $overlay.addClass("active");
      setTimeout(() => {
        $overlay.addClass("active");
      }, 200);
    });
  
    $closeBtn.on("click", function () {
      $overlay.removeClass("active");
      setTimeout(() => {
        $overlay.removeClass("active");
      }, 200);
    });
  
    $overlay.on("click", function (e) {
      if ($(e.target).hasClass("search-overlay")) {
        $overlay.removeClass("active");
      }
    });
  }
  


$(document).ready(function(){
    const data = [
        {
            title: "Home",
            description: "Amplify Your Brand with Cutting-Edge Digital Marketing Solutions ",
            url: "index.html"
        },
        {
            title: "About",
            description: "About Digency Digital Marketing Agency Home / About Us ",
            url: "about.html"
        },
        {
            title: "Services",
            description: "Our Services ",
            url: "service.html"
        },
        {
            title: "Single Services",
            description: "Social Media Marketing ",
            url: "single_services.html"
        },
        {
            title: "Case Studies",
            description: "Case Studies ",
            url: "case_studies.html"
        },
        {
            title: "Our Team",
            description: "Meet Our Team ",
            url: "team.html"
        },
        {
            title: "Partnership",
            description: "Partnership ",
            url: "partnership.html"
        },
        {
            title: "Pricing Plan",
            description: "Pricing Plan ",
            url: "pricing.html"
        },
        {
            title: "Testimonial",
            description: "Testimonials",
            url: "testimonial.html"
        },
        {
            title: "FAQs",
            description: "Simple, Direct, and Friendly Home / FAQ Frequently Asked Questions ",
            url: "faq.html"
        },
        {
            title: "Error 404",
            description: "404 Oops! Page Not Found We couldn't find the page you're looking for. It might have been removed, renamed, or never existed. Back to Home",
            url: "404_page.html"
        },
        {
            title: "Blog",
            description: "Our Blog Home / Blog Insights & Trends Latest Digital Marketing Strategies",
            url: "blog.html"
        },
        {
            title: "Single Post",
            description: "Growth Strategies for Digital Businesses ",
            url: "single_post.html"
        },
        {
            title: "Contact Us",
            description: "Contact Us Home / Contact Us ",
            url: "contact.html"
        },
    ];

    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q");

    const $resultContainer = $("#search-results");
    const $resultTitle = $("#result-title");

    if (keyword) {
        $resultTitle.text(`Search Result for "${keyword}" Digital Marketing Agency`);

        const result = data.filter(item =>
            item.title.toLowerCase().includes(keyword.toLowerCase()) ||
            item.description.toLowerCase().includes(keyword.toLowerCase())
        );

        if (result.length > 0) {
            result.forEach(item => {
                const $div = $("<div>").addClass("result").html(`
                    <a href="${item.url}"><h2>${item.title}</h2></a>
                    <p>${item.description}</p>
                `);
                $resultContainer.append($div);
            });
        } else {
            $resultContainer.html(`<p>No results found for the keyword.</p>`);
        }
    } else {
        $resultTitle.text("Enter search keywords.");
    }
});

function initAnimateData() {
    const $elements = $('[data-animate]');
    const observer = new window.IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const $el = $(entry.target);
                const delay = $el.data('delay') || 0;
                setTimeout(() => {
                    $el.addClass($el.data('animate'));
                    $el.css('opacity', 1);
                    observer.unobserve(entry.target);
                }, delay);
            }
        });
    }, {
        threshold: 0.1
    });
    $elements.each(function() {
        observer.observe(this);
    });
}