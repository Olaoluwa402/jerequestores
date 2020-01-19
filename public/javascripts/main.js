// home page side bar toggler
    $(document).ready(function () {
        $("#sidebar").mCustomScrollbar({
            theme: "minimal"
        });

        $('#dismiss, .overlay').on('click', function () {
            // hide sidebar
            $('#sidebar').removeClass('active');
            // hide overlay
            $('.overlay').removeClass('active');
        });

        $('#sidebarCollapse').on('click', function () {
            // open sidebar
            $('#sidebar').addClass('active');
            // fade in the overlay
            $('.overlay').addClass('active');
            $('.collapse.in').toggleClass('in');
            $('a[aria-expanded=true]').attr('aria-expanded', 'false');
        });
    });

    
    // popover
$(document).ready(function() {
  $('[data-toggle="popover"]').popover({
    html: true,
    content: function() {
      return $('#popover-content').html();
    }
  });
});



// pusher like and unlike
    var updateBlogStats = {
        Like: function (blogId) {
            
            document.querySelector('#likes-count-' + blogId).textContent++;
        },
        Unlike: function(blogId) {
            document.querySelector('#likes-count-' + blogId).textContent--;
        }
    };
    var toggleButtonText = {
        Like: function(button) {
            button.textContent = "Unlike";
        },
        Unlike: function(button) {
            button.textContent = "Like";
        }
    };

    var actOnBlog = function (event) {
        var blogId = event.target.dataset.blogId;
        console.log(blogId);
        var action = event.target.textContent.trim();
        toggleButtonText[action] (event.target);
        updateBlogStats[action](blogId);
         // axios.defaults.headers.post['X-CSRF-Token'] =  `${csrfToken}`;
        axios.post('/blogs/' + blogId + '/act',
                { action: action, socketId: socketId });
    };



    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;
    const pusher = new Pusher('4017053eae6e0df2b134', {
        cluster: 'eu'
    });
    let socketId;
    // retrieve the socket ID on successful connection
    pusher.connection.bind('connected', function() {
        socketId = pusher.connection.socket_id;
    });
    const channel = pusher.subscribe('blog-events');
    channel.bind('blogAction', function(data) {
        // log message data to console - for debugging purposes
        console.log(data);
        const action = data.action;
        updateBlogStats[action](data.blogId);
    });


// // multiple image upload preview
// $(document).ready(function() {
//         let imagesPreview1 = function(input, placeToInsertImagePreview) {
//           if (input.files) {
//             let filesAmount = input.files.length;
//             for (i = 0; i < filesAmount; i++) {
//               let reader = new FileReader();
//               reader.onload = function(event) {
//               	document.getElementById("prev-text").innerHTML = "Image preview";
//                 $($.parseHTML("<img>"))
//                   .attr("src", event.target.result)
//                   .addClass("w-25 pr-2 rounded")
//                   .appendTo(placeToInsertImagePreview);
//               };
//               reader.readAsDataURL(input.files[i]);
//             }
//           }
//         };
//         $("#cover").on("change", function() {
//           imagesPreview(this, "div.preview-cover");
//         });
//       });


//multiple image upload preview
// $(document).ready(function() {
//         let imagesPreview2 = function(input, placeToInsertImagePreview) {
//           if (input.files) {
//             let filesAmount = input.files.length;
//             for (i = 0; i < filesAmount; i++) {
//               let reader = new FileReader();
//               reader.onload = function(event) {
//                 document.getElementById("prev-text").innerHTML = "Image preview";
//                 $($.parseHTML("<img>"))
//                   .attr("src", event.target.result)
//                   .addClass("w-25 pr-2 rounded")
//                   .appendTo(placeToInsertImagePreview);
//               };
//               reader.readAsDataURL(input.files[i]);
//             }
//           }
//         };
//         $("#images").on("change", function() {
//           imagesPreview(this, "div.preview-images");
//         });
//       });