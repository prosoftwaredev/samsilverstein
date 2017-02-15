(function () {

  var hideBtnBack = function () {
    if (window.location.pathname == '/')
      $('#btn-back').hide();
  };

  $(document).ready(function () {
    hideBtnBack();
  });

  /*
   ** for open menu
   */
  $(document).ready(function () {
    $(".menu").click(function () {
      width_content();
      $(".page").addClass("nav_is_open").animate({
        marginLeft: "80%"
      }), 500;
      $("nav").addClass("nav_open");
      $(".close_nav").show();
    });
    $('.close_nav').click(function () {
      width_content();
      $(this).hide();
      $(".page").removeClass("nav_is_open").animate({
        marginLeft: "0"
      }, 500);
      $("nav").removeClass("nav_open");
    });
    var albums = $('.albums');
    $.each(albums, function (k, v) {
      var h = $(this).height();
      $(this).find('img').css('minHeight', h);
    })
  });
  function width_content() {
    var deviseWidth = $('body').width();
    $(".page_content").css('width', deviseWidth);
  };
  $(window).resize(function () {
    width_content();
  });

  /* end for open nem*/

})();


