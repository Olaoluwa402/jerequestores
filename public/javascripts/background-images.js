$(document).ready(function () {
//Replace carousel images into background images.
$('#carousel .item img').each(function() {
  var imgSrc = $(this).attr('src');
  $(this).parent().css({'background-image': 'url('+imgSrc+')'});
  $(this).remove();
});

});