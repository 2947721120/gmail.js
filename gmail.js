var Gmail =  function() {

  var api = {
              get : {},
              observe : {},
              check : {},
              detect : {},
              dom : {}
            };


  api.get.user_email = function() {
    var user_email = null;

    if ($("#gbgs4dn").length == 0) {
      user_email = $("#gbi4t").text();
    } else {
      user_email = $("#gbgs4dn").text();
    }

    if(user_email.indexOf('@') == -1) {
      user_email = $($('.gbps2')[0]).text();
    }

    return user_email.replace(/['"]/g, '').trim();
  };


  api.check.is_thread = function() {
    var check_1 = $($($('.nH .if').children()[1]).children().children()[1]).children();
    var check_2 = $($($($('.nH .if').children()[1]).children()).children()[1]).children();

    return check_1.length > 1 || check_2.length > 1;
  };


  api.dom.inbox_content = function() {
    return $('div[role=main]:first');
  }


  api.check.is_preview_pane = function() {
    var dom = api.dom.inbox_content();
    var box = dom.find("[gh=tl]")[0];

    return box.getAttribute('class').indexOf('aia') != -1;
  }


  api.check.is_horizontal_split = function() {
    var dom = api.dom.inbox_content();
    var box = dom.find("[gh=tl]").find('.nn');

    return box.length == 0; 
  }


  api.check.is_vertical_split = function() {
    return api.check.is_horizontal_split() == false;
  }


  api.check.is_tabbed_inbox = function() {
    return $(".aKh").length == 1;
  }


  api.check.is_right_side_chat = function() {
    return $('.ApVoH')[0].getAttribute('aria-labelledby') == ':wf';
  }


  return api;
}