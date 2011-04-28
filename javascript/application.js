// default lang necessities
$.localize.data.lmgtfy = {
  setup: {
    type_question: "Type a question, click a button.",
    share_link:    "Share the link below.",
    or:            "or"
  },

  play: {
    step_1: "Step 1: Type in your question",
    step_2: "Step 2: Click the Search button",
    pwnage: "Was that so hard?",
    nice:   "It's that easy."
  },

  link: {
    creating:  "Creating...",
    fetching:  "Fetching...",
    copied:    "URL copied to clipboard",
    shortened: "TinyURL copied to clipboard"
  }
};

$.fn.countDown = function() {
  var self       = this;
  var targetDate = dbDate(this.attr("data-ends-at"));

  recurseDurationCountdown();

  function recurseDurationCountdown() {
    var seconds = parseInt((targetDate - new Date()) / 1000);
    self.text(formatDuration(seconds));
    if (seconds > 0) {
      setTimeout(recurseDurationCountdown, 1000);
    }
  }

  function formatDuration(seconds) {
    var hh, mm, ss, days;
    if (seconds <= 0) {
      return "--:--:--";
    }
    else if (seconds > 60 * 60 * 24) {
      days = parseInt(seconds / 60 / 60 / 24);
      var suffix = days > 1 ? "s" : "";
      return days.toString() + " day" + suffix;
    }
    else {
      ss = seconds % 60;
      mm = parseInt(seconds / 60 % 60);
      hh = parseInt(seconds / 60 / 60);
      return hh + ":" + twoDigits(mm) + ":" + twoDigits(ss);
    }
  }

  function twoDigits(n) {
    var prefix = n < 10 ? "0" : "";
    return prefix + n;
  }

  function dbDate(str) {
    var s = $.trim(str);
    s = s.replace(/-/,"/").replace(/-/,"/");
    return new Date(s);
  }
}

$(function(){
  initializeLocalization();
  initializeAboutLink();
  initializeControls();

  var searchString = $.getQueryString({ id: "q" });
  var inputField   = $("input[type=text]:first");
  var fakeMouse    = $("#fake_mouse");
  var instructions = $("#instructions > div");
  var button       = ($.getQueryString({ id: "l" }) == "1") ? $("#lucky") : $("#search");
  var inputLink    = $("#link input.link");
  var linkButtons  = $("#link_buttons");
  var linkMessage  = $("#link_message");

  if (searchString) {
    $("body").addClass("victim");
    $.proMarket("120083", gentlyEncode(searchString));
    googleItForThem();
  }
  else {
    loadSponsorship();
    getTheSearchTerms();
  }

  function loadSponsorship() {
    var callback = function(data) {
      var node = $(".sponsor");
      var tracking_link = "http://aff.lmgtfy.com/offers/" + data._id["$oid"] + "/click"
      node.attr("href", tracking_link);
      node.find(".pitch").css("background-image", "url(" + data.image_url + ")");
      node.find(".region_name").text(data.region_name);
      node.find(".title").text(data.title);
      node.find(".price").text(data.price.replace(/\.00$/, ""));
      node.find(".savings .value").text(data.savings);
      node.find(".action a").attr("href", data.link);
      node.find(".remaining .value")
        .attr("data-ends-at", data.offer_ends_at)
        .countDown(data.offer_ends_at);
      node.fadeIn();
    };
    $.getJSON("http://aff.lmgtfy.com/offers/local.json?callback=?", callback);
  }

  function initializeAboutLink() {
    $("a[name=about]").click(function() {
      $("#about").toggle();
      $('html,body').animate({ scrollTop: $("#about").offset().top }, 1000);
      return false;
    });
    linkifyAbout();
  }

  function initializeControls() {
    $('input.copyable').click(function() { $(this).select(); });
    $("#link").hover(function(){ linkButtons.fadeIn("fast"); }, function(){ linkButtons.fadeOut("fast"); });
    $("#go").click(function(){ window.location.href = inputLink.val(); return false; });
    $("#reset").click(function(){ showTheUrl($(this).attr("url")); return false; });
    $("#tiny").click(function(){
      linkStatus("link.fetching", 0, true);
      $.getJSON("http://json-tinyurl.appspot.com/?callback=?&url=" + gentlyEncode(inputLink.val()), function(data) {
        inputLink.val(data.tinyurl).focus().select();
        linkStatus("link.fetching", 1500);
      });
      $(this).hide();
      $("#reset").show();
      return false;
    });
    $("#language select").change(function(e){
      var l = window.location;
      var hostnameMinusSubdomain = l.hostname.match(/[^.]+\.(?:[^.]+)$/)[0];
      var url = l.protocol + "//" + $(this).val() + "." + hostnameMinusSubdomain + l.pathname;
      window.location.href = url;
    });
  }

  function initializeLocalization() {
    var localize_opts = {
      pathPrefix: 'lang',
      skipLanguage: /^en/,
      callback: function(data, defaultCallback) {
        defaultCallback(data);
        linkifyAbout();
      }
    };
    var lang = $.getQueryString({ id: "lang" }) || sniffUrlForLanguage();
    if (lang) localize_opts.language = lang;
    $("[rel*=localize]").localize('lmgtfy', localize_opts);
  }

  function sniffUrlForLanguage() {
    return sniffSubdomainForLanguage() || sniffDomainForLanguage();
  }

  function sniffSubdomainForLanguage() {
    var first = window.location.hostname.split(".")[0];
    var match = first.match(/^[a-z]{2}(?:-[a-z]{2})?$/i);
    return match ? match[0] : null;
  }

  function sniffDomainForLanguage() {
    var domainLanguageOverrides = {
      "haddkeressemmegneked": "hu",
      "klingon": "xx-KL"
    };

    for (var domain in domainLanguageOverrides) {
      if (window.location.hostname.match(domain)) {
        return domainLanguageOverrides[domain];
      }
    }
    return null;
  }

  function langString(langkey) {
    var keys = langkey.split(/\./);
    return keys.length == 1 ? $.localize.data.lmgtfy[keys[0]] : $.localize.data.lmgtfy[keys[0]][keys[1]];
  }

  function linkifyAbout() {
    $("#about p").each(function() {
      $(this).html($(this).text().replace(/(@([a-zA-Z0-9_]+))/g, '<a href="http://twitter.com/$2">$1</a>'));
    });
  }

  function instruct(langkey) {
    instructions.html(langString(langkey));
  }

  function linkStatus(langkey, millis, stuck) {
    millis = millis || 2500;
    linkMessage.html(langString(langkey)).show().centerOver(inputLink);
    if (!stuck) {
      setTimeout(function(){ linkMessage.fadeOut(millis/4*3); }, millis/4);
    }
  }

  function getTheSearchTerms() {
    // $("#alert").show();
    $("form").submit(function(){ $("#search").click(); return false; });
    instruct("setup.type_question");
    inputField.focus().select();

    $("input[type=button]").click(function(e){
      instruct("setup.share_link");

      var l   = window.location;
      var url = l.protocol + "//" + l.hostname + l.pathname + "?";
      var searchString = gentlyEncode(inputField.val());

      $.proMarket("120083", searchString);

      strings = [ "q=" + searchString ];
      if (this.id == "lucky") strings.push("l=1");

      url += strings.join("&");

      showTheUrl(url);
    });
  }

  function showTheUrl(url) {
    $("#copy").hide();

    $("#link").centerOver($("#link_placeholder")).show();
    $("#reset").attr("url", url).hide();
    $("#tiny").show();

    linkStatus("link.creating", 1500);
    inputLink.val(url).focus().select();
    linkButtons.centerOver(inputLink, 28);
  }

  function googleItForThem() {
    if ($.getQueryString({ id: "fwd" })) redirect();

    $("body").css("cursor", "wait");
    fakeMouse.show();
    instruct("play.step_1");

    fakeMouse.animate({
      top:  (inputField.position().top  + 15).px(),
      left: (inputField.position().left + 10).px()
    }, 1500, 'swing', function(){
      inputField.focus();
      fakeMouse.animate({ top: "+=18px", left: "+=10px" }, 'fast', function() { fixSafariRenderGlitch(); });
      type(searchString, 0);
    });

    function type(string, index){
      var val = string.substr(0, index + 1);
      inputField.attr('value', val);
      if (index < string.length) {
        setTimeout(function(){ type(string, index + 1); }, Math.random() * 240);
      }
      else {
        doneTyping();
      }
    }

    function doneTyping(){
      instruct("play.step_2");
      fakeMouse.animate({
        top:  (button.position().top  + 10).px(),
        left: (button.position().left + 30).px()
      }, 2000, 'swing', function(){
        var key = $.getQueryString({ id: "n" }) == 1 ? "play.nice" : "play.pwnage";
        instruct(key);
        button.focus();
        setTimeout(redirect, 2000);
      });
    }

    function easterEgg(){
      if (searchString == "funny sarah jessica parker movie") {
        return "/movie-not-found.html";
      } else {
        return false;
      }
    }

    function redirect(){
      if ($.getQueryString({ id: "debug" })) return;

      var google = "http://vanillaresults.com/?q=";
      if (button.attr("id") == $("#lucky").attr("id")) {
        google = "http://www.google.com/search?hl=en&btnI=I%27m+Feeling+Lucky&pws=0&q=";
      }

      var egg = easterEgg();
      if (egg) {
        page = egg;
      } else {
        page = google + gentlyEncode(searchString);
      }

      window.location.href = page;
    }

    function fixSafariRenderGlitch() {
      if ($.browser.safari) inputField.blur().focus();
    }
  }
});
