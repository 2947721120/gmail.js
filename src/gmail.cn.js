///////////////////////////////////////////
// gmail.js
// Kartik Talwar
// https://github.com/KartikTalwar/gmail.js
//

var Gmail_ = function(localJQuery) {

  /*
   使用随机提供的“jQuery的”如果可能的话，为了避免与冲突
    这为其他目的使用$其他扩展。
  */
  var $;
  if (typeof localJQuery !== "undefined") {
    $ = localJQuery;
  } else if (typeof jQuery !== "undefined") {
    $ = jQuery;
  }
  //别人离开$ undefined，这可能会为了某些目的被罚款。

  var api = {
              get : {},
              observe : {},
              check : {},
              tools : {},
              tracker : {},
              dom : {},
              chat : {},
              compose : {},
              helper : {get: {}}
            };

  api.version           = "0.5";
  api.tracker.globals   = typeof GLOBALS !== 'undefined' ? GLOBALS : ( window.opener != null && typeof window.opener.GLOBALS !== 'undefined' ? window.opener.GLOBALS : [] );
  api.tracker.view_data = typeof VIEW_DATA !== 'undefined' ? VIEW_DATA : ( window.opener != null && typeof window.opener.VIEW_DATA !== 'undefined' ? window.opener.VIEW_DATA : [] );
  api.tracker.ik        = api.tracker.globals[9] || "";
  api.tracker.hangouts  = undefined;


  api.get.last_active = function() {
    var data = api.tracker.globals[17][15];
    return {
             time : data[1],
             ip : data[3],
             mac_address : data[9],
             time_relative : data[10]
           };
  };


  api.get.loggedin_accounts = function() {
    var i, j, data;
    var users = [];

    var globals17 = api.tracker.globals[17];
    for (i in globals17) {
     //至少委派的收件箱中，工作重点的指标并不稳定
      //有人观察到22和24之间的某个地方，但我们不应该依赖于它
      data = globals17[i];

      if (data[0] === 'mla') {
        for(j in data[1]) {
          users.push({
            name : data[1][j][4],
            email : data[1][j][0],
            index: data[1][j][3]
          });
        }

        return users;
      }
    }

    return users;
  };


  api.get.user_email = function() {
    return api.tracker.globals[10];
  };


  api.get.manager_email = function() {
    if (api.helper.get.is_delegated_inbox()) {
      return api.get.delegated_to_email();
    }

    return api.get.user_email();
  };


  api.get.delegated_to_email = function() {
    if (!api.helper.get.is_delegated_inbox()) {
      return null;
    }

    var i, account;
    var userIndexPrefix = "/u/";
    var pathname = window.location.pathname;
    var delegatedToUserIndex = parseInt(pathname.substring(pathname.indexOf(userIndexPrefix) + userIndexPrefix.length), 10);

    var loggedInAccounts = api.get.loggedin_accounts();
    if (loggedInAccounts && loggedInAccounts.length > 0) {
      for (i in loggedInAccounts) {
        account = loggedInAccounts[i];
        if (account.index === delegatedToUserIndex) {
          return account.email;
        }
      }
    }

    // 作为最后的手段，我们查询帐户右上角选择菜单的DOM
    return $(".gb_rb[href$='" + userIndexPrefix + delegatedToUserIndex + "'] .gb_yb").text().split(" ")[0];
  };


  api.get.localization = function() {
    var isLocale = function(locale) {
    //语言环境是指以2个字母，小写开头的字符串。
      //将“小写”检查区别于其他两字母串像“美国的语言环境
      //（用户的位置？）。
      if (!locale || ((typeof locale) !== 'string') || locale.length < 2) {
        return false;
      }

      var localePrefix = locale.slice(0, 2);
      return localePrefix.toLowerCase() === localePrefix;
    };

    var globals = api.tracker.globals;

    // 第一候选人。
    var locale = globals[17] && globals[17][8] && globals[17][8][8];
    if (isLocale(locale)) {
      return locale;
    }

    //第二候选人。
    locale = globals[17] && globals[17][9] && globals[17][9][8];
    if (isLocale(locale)) {
      return locale;
    }

    return null;
  };


  api.check.is_thread = function() {
    var check_1 = $('.nH .if').children(":eq(1)").children().children(":eq(1)").children();
    var check_2 = api.get.email_ids();

    return check_1.length > 1 || check_2.length > 1;
  };


  api.dom.inbox_content = function() {
    return $('div[role=main]:first');
  };


  api.check.is_preview_pane = function() {
    var dom = api.dom.inbox_content();
    var boxes = dom.find("[gh=tl]");

    var previewPaneFound = false;
    boxes.each(function() {
      if($(this).hasClass('aia')) {
        previewPaneFound = true;
      }
    });

    return previewPaneFound;
  };

  api.check.is_multiple_inbox = function() {
    var dom = api.dom.inboxes();
    return dom.length > 1;
  };


  api.check.is_horizontal_split = function() {
    var dom = api.dom.inbox_content();
    var box = dom.find("[gh=tl]").find('.nn');

    return box.length == 0;
  };


  api.check.is_vertical_split = function() {
    return api.check.is_horizontal_split() == false;
  };


  api.check.is_tabbed_inbox = function() {
    return $(".aKh").length == 1;
  };


  api.check.is_right_side_chat = function() {
    var chat = $('.ApVoH');
    if(chat.length === 0) {
      return false;
    }

    return chat[0].getAttribute('aria-labelledby') == ':wf';
  }

  api.check.should_compose_fullscreen = function(){
    var bx_scfs = [];
    try {
      bx_scfs = api.tracker.globals[17][4][1][32];
    } catch(er) {
      bx_scfs = ['bx_scfs','false'];
    }
     return (bx_scfs[1] == 'true' ) ? true : false;
  }


  api.check.is_google_apps_user =function() {
    var email = api.get.user_email();
    return email.indexOf('gmail.com', email.length - 'gmail.com'.length) == -1;
  };


  api.get.storage_info = function() {
    var div = $('.md.mj').find('div')[0];
    var used = $(div).find('span')[0].text;
    var total = $(div).find('span')[1].text;
    var percent = parseFloat(used.replace(/[^0-9\.]/g, '')) * 100 / parseFloat(total.replace(/[^0-9\.]/g, ''));

    return {used : used, total : total, percent : Math.floor(percent)}
  };


  api.dom.inboxes = function() {
    var dom = api.dom.inbox_content();
    return dom.find("[gh=tl]");
  };

  api.dom.email_subject = function () {
    var e = $(".hP");

    for(var i=0; i<e.length; i++) {
      if($(e[i]).is(':visible')) {
        return $(e[i]);
      }
    }

    return $();
  };


  api.get.email_subject = function() {
    var subject_dom = api.dom.email_subject();

    return subject_dom.text();
  };


  api.dom.email_body = function() {
    return $('.nH.hx');
  };

  api.dom.toolbar = function() {
    var tb = $("[gh='mtb']");

    while($(tb).children().length == 1){
      tb = $(tb).children().first();
    }

    return tb;
};


  api.check.is_inside_email = function() {
    if(api.get.current_page() != 'email' && !api.check.is_preview_pane()) {
      return false;
    }

    var items = $('.ii.gt .a3s.aXjCH');
    var ids = [];

    for(var i=0; i<items.length; i++) {
      var mail_id = items[i].getAttribute('class').split(' ')[2];
      if(mail_id != 'undefined' && mail_id != undefined) {
        if($(items[i]).is(':visible')) {
          ids.push(items[i]);
        }
      }
    }

    return ids.length > 0;
  };

  api.check.is_plain_text = function() {
    var settings = GLOBALS[17][4][1];

    for (var i = 0; i < settings.length; i++) {
      var plain_text_setting = settings[i];
      if (plain_text_setting[0] === 'bx_cm') {
        return plain_text_setting[1] === '0';
      }
    }

    // 默认情况下，以丰富的文本模式，这是比较常见的时下
    return false;
  };

  api.dom.email_contents = function() {
    var items = $('.ii.gt div.a3s.aXjCH');
    var ids = [];

    for(var i=0; i<items.length; i++) {
      var mail_id = items[i].getAttribute('class').split(' ')[2];
      var is_editable = items[i].getAttribute('contenteditable');
      if(mail_id != 'undefined' && mail_id != undefined) {
        if(is_editable != 'true') {
          ids.push(items[i]);
        }
      }
    }

    return ids;
  };


  api.get.email_ids = function() {
    if(api.check.is_inside_email()) {
      var data = api.get.email_data();
      return Object.keys(data.threads);
    }
    return [];
  };


  api.get.compose_ids = function() {
      var ret = [];
      var dom = $(".AD [name=draft]");
      for(var i = 0; i < dom.length; i++) {
          if(dom[i].value != "undefined"){
              ret.push(dom[i].value);
          }
      }
      return ret;
  };


  api.get.email_id = function() {
    var hash = null;

    if(api.check.is_inside_email()) {
      if(api.check.is_preview_pane()) {
        var items = api.dom.email_contents();
        var text = [];

        for(var i=0; i<items.length; i++) {
          var mail_id = items[i].children[0].getAttribute('class').split(' ')[2];
          var is_editable = items[i].getAttribute('contenteditable');
          var is_visible = items[i].offsetWidth > 0 && items[i].offsetHeight > 0;
          if(mail_id != 'undefined' && mail_id != undefined && is_visible) {
            if(is_editable != 'true') {
              text.push(mail_id);
            }
          }
        }

        hash = text[0].substring(1, text[0].length);
      } else {
        hash = window.location.hash.split("/").pop().replace(/#/, '').split('?')[0];
      }
    }
    else {
      hash = api.tools.parse_url(window.location.href).th;
    }
    
    return hash;
  };


  api.check.is_priority_inbox = function() {
    return $('.qh').length > 0;
  };


  api.check.is_rapportive_installed = function() {
    return $('#rapportive-sidebar').length == 1;
  };


  api.check.is_streak_installed = function() {
    return $("[id^='bentoBox'],[id*=' bentoBox'],[class*=' bentoBox'],[class*='bentoBox']").length > 0;
  };


  api.check.is_anydo_installed = function() {
    return $("[id^='anydo'],[id*=' anydo'],[class*=' anydo'],[class*='anydo']").length > 0;
  };


  api.check.is_boomerang_installed = function() {
    return $("[id^='b4g_'],[id*=' b4g_'],[class*=' b4g_'],[class*='b4g_']").length > 0;
  };


  api.check.is_xobni_installed = function() {
    return $('#xobni_frame').length > 0;
  };


  api.check.is_signal_installed = function() {
    return $("[id^='Signal'],[id*=' Signal'],[class*=' signal'],[class*='signal']").length > 0;
  };


  api.check.are_shortcuts_enabled = function() {
    var flag_name = 'bx_hs';
    var flag_value = undefined;

    var check = true; // 标志可能缺少康沃视图。

    var array_with_flag = api.tracker.globals[17][4][1];

    for(var i=0; i<array_with_flag.length; i++) {
      var current = array_with_flag[i];

      if(current[0] === flag_name) {
        flag_value = current[1];
        break;
      }
    }

    if(flag_value !== undefined) {
      var values = {
        '0': true,
        '1': false
      };

      check = values[flag_value];
    }

    return check;
  };


  api.dom.get_left_sidebar_links = function() {
    return $("div[role=navigation] [title]");
  };


  api.dom.search_bar = function() {
    return $("[gh=sb]");
  };


  api.get.search_query = function() {
    var dom = api.dom.search_bar();
    return dom.find('input')[0].value;
  };


  api.get.unread_inbox_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('inbox') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_draft_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('drafts') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_spam_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('spam') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_forum_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('forums') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_update_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('updates') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_promotion_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('promotions') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.unread_social_emails = function() {
    var dom = $("div[role=navigation]").find("[title*='" + api.tools.i18n('social_updates') + "']");

    if(dom.length > 0) {
      if(dom[0].text.indexOf('(') != -1) {
        return parseInt(dom[0].text.replace(/[^0-9]/g, ''));
      }
    }

    return 0;
  };


  api.get.beta = function() {
    var features = {
                    "new_nav_bar" : $('#gbz').length == 0
                   };

    return features;
  };


  api.get.unread_emails = function() {
    return { inbox         : api.get.unread_inbox_emails(),
             drafts        : api.get.unread_draft_emails(),
             spam          : api.get.unread_spam_emails(),
             forum         : api.get.unread_forum_emails(),
             update        : api.get.unread_update_emails(),
             promotions    : api.get.unread_promotion_emails(),
             social        : api.get.unread_social_emails() }
  };


  api.tools.error = function(str) {
    if (console) {
      console.error(str);
    } else {
      throw(str);
    }
  };

  api.tools.parse_url = function(url) {
    var regex = /[?&]([^=#]+)=([^&#]*)/g;
    var params = {};
    var match;

    while (match = regex.exec(url)) {
      params[match[1]] = match[2];
    }

    return params;
  };

  api.tools.sleep = function(milliseconds) {
    var start = new Date().getTime();
    while(true) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  };


  api.tools.multitry = function(delay, tries, func, check, counter, retval) {
    if(counter != undefined && counter >= tries) {
      return retval;
    }

    counter = (counter == undefined) ? 0 : counter;

    var value = func();

    if(check(value)) {
      return value;
    } else {
      api.tools.sleep(delay);
      api.tools.multitry(delay, tries, func, check, counter+1, value);
    }
  };


  api.tools.deparam = function (params, coerce) {

    var each = function (arr, fnc) {
      var data = [];
      for (var i = 0; i < arr.length; i++) {
        data.push(fnc(arr[i]));
      }
      return data;
    };

    var isArray = Array.isArray || function(obj) {
      return Object.prototype.toString.call(obj) == '[object Array]';
    };

    var obj = {},
      coerce_types = {
        'true': !0,
        'false': !1,
        'null': null
      };
    each(params.replace(/\+/g, ' ').split('&'), function (v, j) {
      var param = v.split('='),
        key = decodeURIComponent(param[0]),
        val,
        cur = obj,
        i = 0,
        keys = key.split(']['),
        keys_last = keys.length - 1;
      if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
        keys[keys_last] = keys[keys_last].replace(/\]$/, '');
        keys = keys.shift().split('[').concat(keys);
        keys_last = keys.length - 1;
      } else {
        keys_last = 0;
      }
      if (param.length === 2) {
        val = decodeURIComponent(param[1]);
        if (coerce) {
          val = val && !isNaN(val) ? +val : val === 'undefined' ? undefined : coerce_types[val] !== undefined ? coerce_types[val] : val;
        }
        if (keys_last) {
          for (; i <= keys_last; i++) {
            key = keys[i] === '' ? cur.length : keys[i];
            cur = cur[key] = i < keys_last ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : []) : val;
          }
        } else {
          if (isArray(obj[key])) {
            obj[key].push(val);
          } else if (obj[key] !== undefined) {
            obj[key] = [obj[key], val];
          } else {
            obj[key] = val;
          }
        }
      } else if (key) {
        obj[key] = coerce ? undefined : '';
      }
    });
    return obj;
  };

  api.tools.parse_actions = function(params, xhr) {

    // 上传附件事件 - 如果找到了，不检查其他观察员。见问题 #22
    if(params.url.act == 'fup' || params.url.act == 'fuv' || params.body_is_object) {
      return params.body_is_object && api.observe.bound('upload_attachment') ? { upload_attachment: [ params.body_params ] } : false; // trigger attachment event
    }

    if(params.url.search != undefined) {
      // console.log(params.url, params.body, params.url_raw);
    }

    var triggered = {}; // store an object of event_name: [response_args] for events triggered by parsing the actions
    var action_map = {
                      'tae'         : 'add_to_tasks',
                      'rc_^i'       : 'archive',
                      'tr'          : 'delete',
                      'cs'          : 'undo_send',
                      'dm'          : 'delete_message_in_thread',
                      'dl'          : 'delete_forever',
                      'dc_'         : 'delete_label',
                      'dr'          : 'discard_draft',
                      'el'          : 'expand_categories',
                      'cffm'        : 'filter_messages_like_these',
                      'arl'         : 'label',
                      'mai'         : 'mark_as_important',
                      'mani'        : 'mark_as_not_important',
                      'us'          : 'mark_as_not_spam',
                      'sp'          : 'mark_as_spam',
                      'mt'          : 'move_label',
                      'ib'          : 'move_to_inbox',
                      'ig'          : 'mute',
                      'rd'          : 'read',
                      'sd'          : 'save_draft',
                      'sm'          : 'send_message',
                      'mo'          : 'show_newly_arrived_message',
                      'st'          : 'star',
                      'ug'          : 'unmute',
                      'ur'          : 'unread',
                      'xst'         : 'unstar',
                      'new_mail'    : 'new_email',
                      'poll'        : 'poll',
                      'refresh'     : 'refresh',
                      'rtr'         : 'restore_message_in_thread',
                      'open_email'  : 'open_email',
                      'toggle_threads'  : 'toggle_threads'
                     };

    if(typeof params.url.ik == 'string') {
      api.tracker.ik = params.url.ik;
    }

    if(typeof params.url.at == 'string') {
      api.tracker.at = params.url.at
    }

    if(typeof params.url.rid == 'string') {
      if(params.url.rid.indexOf("mail") != -1) {
        api.tracker.rid = params.url.rid;
      }
    }

    var action      = decodeURIComponent(params.url.act);
    var sent_params = params.body_params;
    var email_ids   = (typeof sent_params.t == 'string') ? [sent_params.t] : sent_params.t;
    var response    = null;

    switch(action) {
      case "cs":
      case "ur":
      case "rd":
      case "tr":
      case "sp":
      case "us":
      case "ib":
      case "dl":
      case "st":
      case "xst":
      case "mai":
      case "mani":
      case "ig":
      case "ug":
      case "dr":
      case "mt":
      case "cffm":
      case "rc_^i":
        response = [email_ids, params.url, params.body];
        break;

      case "arl":
        response = [email_ids, params.url, params.body, params.url.acn];
        break;

      case "sd":
        response = [email_ids, params.url, sent_params];
        break;

      case "tae":
      case "sm":
        response = [params.url, params.body, sent_params];
        break;

      case "el":
        response = [params.url, params.body, sent_params.ex == '1'];
        break;

      case "dm":
      case "rtr":
      case "mo":
        response = [sent_params.m, params.url, params.body];
        break;

    }

    if(typeof params.url._reqid == 'string' && params.url.view === 'tl' && params.url.auto != undefined) {
      response = [params.url.th, params.url, params.body];
      if(api.observe.bound('new_email')) {
        triggered.new_email = response;
      }
    }

    if((params.url.view == 'cv' || params.url.view == 'ad') && typeof params.url.th == 'string' && typeof params.url.search == 'string' && params.url.rid == undefined) {
      response = [params.url.th, params.url, params.body];
      if(api.observe.bound('open_email')) {
        triggered.open_email = response;
      }
    }

    if((params.url.view == 'cv' || params.url.view == 'ad') && typeof params.url.th == 'object' && typeof params.url.search == 'string' && params.url.rid != undefined) {
      response = [params.url.th, params.url, params.body];
      if(api.observe.bound('toggle_threads')) {
        triggered.toggle_threads = response;
      }
    }

    if((params.url.view == 'cv' || params.url.view == 'ad') && typeof params.url.th == 'string' && typeof params.url.search == 'string' && params.url.rid != undefined) {
      if(params.url.msgs != undefined) {
        response = [params.url.th, params.url, params.body];
        if(api.observe.bound('toggle_threads')) {
          triggered.toggle_threads = response;
        }
      }
    }

    if(typeof params.url.SID == 'string' && typeof params.url.zx == 'string' && params.body.indexOf('req0_') != -1) {
      api.tracker.SID = params.url.SID;
      response = [params.url, params.body, sent_params];
      if(api.observe.bound('poll')) {
        triggered.poll = response;
      }
    }

    if(typeof params.url.ik == 'string' && typeof params.url.search == 'string' && params.body.length == 0 && typeof params.url._reqid == 'string') {
      response = [params.url, params.body, sent_params];
      if(api.observe.bound('refresh')) {
        triggered.refresh = response;
      }
    }

    if(response && action_map[action] && api.observe.bound(action_map[action])) {
      triggered[action_map[action]] = response;
    }

    if(params.method == 'POST' && (typeof params.url.SID == 'string'
                                   || typeof params.url.ik == 'string'
                                   || typeof params.url.act == 'string')) {
      triggered.http_event = [params]; // 发送每一个事件和所有数据
    }

    return triggered;
  };

  api.tools.parse_response = function(response) {
      var parsedResponse = [],
          data, dataLength, endIndex, realData;

      try {

        //Gmail的后响应结构
        // )}]'\n<datalength><rawData>\n<dataLength><rawData>...

        // 准备响应，除去保护的eval
        response = response.replace(/\n/g, ' ');
        response = response.substring(response.indexOf("'") + 1, response.length);

        while(response.replace(/\s/g, '').length > 1) {

          //多久是获取数据
          dataLength = response.substring(0, response.indexOf('[')).replace(/\s/g, '');
          if (!dataLength) {dataLength = response.length;}

          endIndex = (parseInt(dataLength, 10) - 2) + response.indexOf('[');
          data = response.substring(response.indexOf('['), endIndex);

          var get_data = new Function('"use strict"; return ' + data);
          realData = get_data();

          parsedResponse.push(realData);

          //准备下一个环路响应
          response = response.substring(response.indexOf('['), response.length);
          response = response.substring(data.length, response.length);
        }
      } catch (e) {
          console.log('Gmail post response parsing failed.', e);
      }

      return parsedResponse;
  };

  api.tools.parse_requests = function(params, xhr) {
    params.url_raw = params.url;
    params.url = api.tools.parse_url(params.url);
    if(typeof params.body == 'object') {
      params.body_params = params.body;
      params.body_is_object = true;
    } else {
      params.body_params = api.tools.deparam(params.body);
    }

    if(typeof api.tracker.events != 'object' && typeof api.tracker.actions != 'object') {
      api.tracker.events  = [];
      api.tracker.actions = [];
    }

    api.tracker.events.unshift(params);
    var events = api.tools.parse_actions(params, xhr);

    if(params.method == 'POST' && typeof params.url.act == 'string') {
      api.tracker.actions.unshift(params);
    }

    if(api.tracker.events.length > 50) {
      api.tracker.events.pop();
    }

    if(api.tracker.actions.length > 10) {
      api.tracker.actions.pop();
    }
    return events;
  };


  api.tools.xhr_watcher = function () {
    if (!api.tracker.xhr_init) {
      api.tracker.xhr_init = true;
      var win = top.document.getElementById("js_frame") ? top.document.getElementById("js_frame").contentDocument.defaultView : window.opener.top.document.getElementById("js_frame").contentDocument.defaultView;

      if (!win.gjs_XMLHttpRequest_open) {
        win.gjs_XMLHttpRequest_open = win.XMLHttpRequest.prototype.open;
      }

      win.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        var out = win.gjs_XMLHttpRequest_open.apply(this, arguments);
        this.xhrParams = {
          method: method.toString(),
          url: url.toString()
        };
        return out;
      };

      if (!win.gjs_XMLHttpRequest_send) {
        win.gjs_XMLHttpRequest_send = win.XMLHttpRequest.prototype.send;
      }

      win.XMLHttpRequest.prototype.send = function (body) {
        //解析XHR请求，以确定是否任何事件应当触发
        var events = false;
        if (this.xhrParams) {
          this.xhrParams.body = body;
          events = api.tools.parse_requests(this.xhrParams, this);
        }

        // 事件之前火
        if(api.observe.trigger('before', events, this)) {

         //如果事件被解雇之前，重建参数[0]/体字符串
          // TODO：重新创建URL如果我们要支持操纵URL ARGS（有没有在那里，这将需要一个用例？）
          body = arguments[0] = this.xhrParams.body_is_object ? this.xhrParams.body_params : $.param(this.xhrParams.body_params,true).replace(/\+/g, "%20");
        }

        // 如果事件发生后任何匹配的，绑定的onreadystatechange回调
        if(api.observe.bound(events,'after')) {
          var curr_onreadystatechange = this.onreadystatechange;
          var xhr = this;
          this.onreadystatechange = function(progress) {
            if (this.readyState === this.DONE) {
              xhr.xhrResponse = api.tools.parse_response(progress.target.responseText);
              api.observe.trigger('after', events, xhr);
            }
            if (curr_onreadystatechange) {
              curr_onreadystatechange.apply(this, arguments);
            }
          }
        }

        //发送原始请求
        var out = win.gjs_XMLHttpRequest_send.apply(this, arguments);

        // 火灾事件
        api.observe.trigger('on', events, this);
        return out;
      }
    }
  };


  api.observe.http_requests = function() {
    return api.tracker.events;
  };


  api.observe.actions = function() {
    return api.tracker.actions;
  };

  /**
   绑定一个指定的回调回调数组对指定类型及作用
   */
  api.observe.bind = function(type, action, callback) {

    // 设置看门狗数据结构
    if(typeof api.tracker.watchdog != "object") {
      api.tracker.watchdog = {
        before: {},
        on: {},
        after: {},
        dom: {}
      };
      api.tracker.bound = {};
    }
    if(typeof api.tracker.watchdog[type] != "object") {
      api.tools.error('api.observe.bind called with invalid type: ' + type);
    }

    //确保我们在观看XHR请求
    if(type != 'dom' && !api.tracker.xhr_init) {
      api.tools.xhr_watcher();
    }

    // 添加回调到一个数组中的看门狗
    if(typeof api.tracker.watchdog[type][action] != 'object') {
      api.tracker.watchdog[type][action] = [];
    }
    api.tracker.watchdog[type][action].push(callback);

  //允许检查绑定事件的具体行动/尽可能高效地输入（无循环） - 位代码脏，
    //但查找（api.observer.bound）由数百名执行＆我认为额外的效率是值得的权衡
    api.tracker.bound[action] = typeof api.tracker.bound[action] == 'undefined' ? 1 : api.tracker.bound[action]+1;
    api.tracker.bound[type] = typeof api.tracker.bound[type] == 'undefined' ? 1 : api.tracker.bound[type]+1;
    //api.tracker.watchdog[action] = callback;
  };

  /**
   Gmail中发送一个XHR请求后立即观察到的事件的
   */
  api.observe.on = function(action, callback, response_callback) {

    //检查DOM观察员的行动，如果没有找到，承担XHR观察者
    if(api.observe.on_dom(action, callback)) return true;

    //绑定XHR观察家
    api.observe.bind('on', action, callback);
    if (response_callback) {
      api.observe.after(action, callback);
    }
  };

  /**
   事件发生之前观察之前，为了发送Gmail的XHR请求
    事件之前必须修改XHR请求的能力，然后发送
   */
  api.observe.before = function(action, callback) {
    api.observe.bind('before', action, callback);
  };

  /**
 当Gmail的XHR请求从服务器返回一个事件后，观察
    与服务器响应
   */
  api.observe.after = function(action, callback) {
    api.observe.bind('after', action, callback);
  };

  /**
检查是否有指定的操作和类型有任何绑定到它
    如果类型为null，将检查这个动作势必在任何类型的
    如果动作为null，将检查绑定到任何类型的动作
   */
  api.observe.bound = function(action, type) {
    if (typeof api.tracker.watchdog != "object") return false;
    if (action) {

      // 如果行为对象 { event: [response] })（格式触发事件{活动：[回应]}）通过后，检查是否有这些都是绑定
        var match = false;
        $.each(action,function(key,response){
          if(typeof api.tracker.watchdog[type][key] == "object") match = true;
        });
        return match;
      }
      if(type) return typeof api.tracker.watchdog[type][action] == "object";
      return api.tracker.bound[action] > 0;
    } else {
      if(type) return api.tracker.bound[type] > 0;
      api.tools.error('api.observe.bound called with invalid args');
    }
  };

  /**
   清除所有的回调，特定类型的（前上后，DOM）和行动
    如果动作为null，所有操作都将被清除
    如果类型为null，所有类型将被清除
   */
  api.observe.off = function(action, type) {

    //如果看门狗没有设置，绑定尚未被称为所以没有关闭
    if(typeof api.tracker.watchdog != "object") return true;

    //通过适用类型的循环
    var types = type ? [ type ] : [ 'before', 'on', 'after', 'dom' ];
    $.each(types, function(idx, type) {
      if(typeof api.tracker.watchdog[type] != 'object') return true; // 没有回调对于这种类型的

      //如果指定的操作，删除任何回调这个动作，否则就删除所有的回调，所有操作
      if(action) {
        if(typeof api.tracker.watchdog[type][action] == 'object') {
          api.tracker.bound[action] -= api.tracker.watchdog[type][action].length;
          api.tracker.bound[type] -= api.tracker.watchdog[type][action].length;
          delete api.tracker.watchdog[type][action];
        }
      } else {
        $.each(api.tracker.watchdog[type], function(act,callbacks) {
          if(typeof api.tracker.watchdog[type][act] == 'object') {
            api.tracker.bound[act] -= api.tracker.watchdog[type][act].length;
            api.tracker.bound[type] -= api.tracker.watchdog[type][act].length;
            delete api.tracker.watchdog[type][act];
          }
        });
      }
    });
  };

  /**
 触发绑定到传递类型的任何特定事件返回true或false取决于如果任何事件被解雇
   */
  api.observe.trigger = function(type, events, xhr) {
    if(!events) return false;
    var fired = false;
    $.each(events, function(action,response) {

      // 我们每次都做到这一点这里保持与旧响应回调实现向后兼容
      response = $.extend([], response); // 中断引用，因此它不会持续增长每次触发
      if(type == 'after') response.push(xhr.xhrResponse); // 向后COMPAT的要求事件发生之后，我们的onreadystatechange推首先分析响应
      response.push(xhr);
      if(api.observe.bound(action, type)) {
        fired = true;
        $.each(api.tracker.watchdog[type][action], function(idx, callback) {
          callback.apply(undefined, response);
        });
      }
    });
    return fired;
  };

  /**
   触发传递一个指定的元素和可选处理任何指定的DOM事件
   */
  api.observe.trigger_dom = function(observer, element, handler) {

    // 如果没有定义的处理程序，只需要调用回调
    if (!handler) {
      handler = function(match, callback) {
        callback(match)
      };
    }
    if (!api.tracker.watchdog.dom[observer]) {
      return;
    }
    $.each(api.tracker.watchdog.dom[observer], function(idx, callback) {
      handler(element, callback);
    });
  };

  // pre-configuredDOM观察
  //地图观察员DOM类名
  //作为元件被插入到DOM，这些类将被检查并且被映射事件触发，
  //接收'E'事件对象，一个jQuery约束插入DOM元素
  //注意：支持观察员和sub_observers必须supported_observers阵列还有dom_observers配置中注册
  //配置示例: event_name: {
  //                   class: 'className', // required -为您在插入的DOM元素该类名称
  //                   selector: 'div.className#myId', // 如果你需要匹配不仅仅是一个特定元素的类名来指示匹配，你可以使用这个选择进一步的检查（匹配元素上使用element.is（选择））。 例如。如果有一类的多个元素指示观察者应该火，但你只希望它火在一个特定的ID，那么你可以使用这个
  //                   sub_selector: 'div.className', // 如果指定了，我们做一个jQuery element.find为插入的元素传递的选择，并确保我们能找到一个匹配
  //                   handler: function( matchElement, callback ) {}, // 如果指定，如果发现匹配这个处理程序被调用。否则默认调用回调和传递jQuery的匹配元素
  //                   sub_observers: { }, // EVENT_NAME的哈希值：config_hash - 配置哈希支持此配置哈希的所有属性。观察员将被绑定为DOMNodeInserted到匹配的类+ sub_selector元素。
  //                 },
  // TODO：电流限制允许每个观看的className只有1动作（即，每个观看类必须
   // 独特）。如果需要此功能，这可以通过推压到一个数组被周围的工作
  //下面api.tracker.dom_observer_map
  // console.log( 'Observer set for', action, callback);
  api.observe.initialize_dom_observers = function() {
    api.tracker.dom_observer_init = true;
    api.tracker.supported_observers = ['view_thread', 'view_email', 'load_email_menu', 'recipient_change', 'compose'];
    api.tracker.dom_observers = {

被点击//当一个线程在查看邮箱 - 注：这应该开火了类似的时间（后直接）作为open_email XHR观察者
      //这是由XHR请求触发，而不是被插入节点到DOM（并因此返回不同的信息）
      'view_thread': {
        class: ['Bu', 'nH'], // 类依赖，如果is_preview_pane - 卜预览窗格中，NH为标准视图
        sub_selector: 'div.if',
        handler: function(match, callback) {
          match = new api.dom.thread(match);
          callback(match);

      //查找在这个线程的任何电子邮件元素正在显示
      //和火掉任何观点电子邮件子观察员他们每个人
          var email = match.dom('opened_email');
          if (email.length) {
            api.observe.trigger_dom('view_email', email, api.tracker.dom_observers.view_thread.sub_observers.view_email.handler);
          }
        },
        sub_observers: {

          //当个人电子邮件线程中加载（也时触发线程负载展示最新的电子邮件）
          'view_email': {
            class: '',
            sub_selector: 'div.adn',
            handler: function(match, callback) {
              match = new api.dom.email(match);
              callback(match);
            }
          },

          //观看电子邮件时，当下拉旁边的回复按钮菜单被插入到DOM
          'load_email_menu': {
              class: 'J-N',
              selector: 'div[role=menu] div[role=menuitem]:first-child', // 使用弹出第一个菜单项最多为指示剂来触发此观察者
              handler: function(match, callback) {
                match = match.closest('div[role=menu]');
                callback(match);
              }
          }
        }
      },

      // 新的电子邮件地址添加到任何收件人，抄送，密送域撰写新邮件或回复时/转发
      'recipient_change': {
        class: 'vR',
        handler: function(match, callback) {
          // console.log('compose:recipient handler called',match,callback);

        //我们需要在处理程序的执行小延迟时答复收件人场初始化（或恢复撰写/草案）
          //那么多的DOM元素将被插入每个收件人造成这一处理程序来执行多次
          //实际上我们只想要一个回调，所以给其他节点时要插入＆然后只执行一次回调
          if(typeof api.tracker.recipient_matches != 'object') {
            api.tracker.recipient_matches = [];
          }
          api.tracker.recipient_matches.push(match);
          setTimeout(function(){
            // console.log('recipient timeout handler', api.tracker.recipient_matches.length);
            if(!api.tracker.recipient_matches.length) return;

            // 确定要，CC和BCC和提取指定地址的所有电子邮件的数组回调对象
            var compose = new api.dom.compose(api.tracker.recipient_matches[0].closest('div.M9'));
            var recipients = compose.recipients();
            callback(compose, recipients, api.tracker.recipient_matches);

            // 重新比赛所以没有前途推迟这个函数的执行实例
            api.tracker.recipient_matches = [];
          },100);
        }
      },

      // 如果创建一个新的撰写，回复或转发，这将触发。如果回复变为正向和反之亦然它不会着火
      //传递一个类型的撰写，回复或转发回调
      'compose': {
        class: 'An', // M9会更好，但这不是设置在插入点
        handler: function(match, callback) {
          // console.log('reply_forward handler called', match, callback);

          // 回首了DOM树M9（主回复/转发节点）
          match = match.closest('div.M9');
          if (!match.length) return;
          match = new api.dom.compose(match);
          var type;
          if (match.is_inline()) {
            type = match.find('input[name=subject]').val().indexOf('Fw') == 0 ? 'forward' : 'reply';
          } else {
            type = 'compose';
          }
          callback(match,type);
        }
      }
    };

    //支持自定义扩展的观察员
    if (api.tracker.custom_supported_observers) {
      $.merge(api.tracker.supported_observers, api.tracker.custom_supported_observers);
      $.extend(true, api.tracker.dom_observers, api.tracker.custom_dom_observers); //深复制到子观察家复制有关的地方
    }

    //图观察类名来行动
    api.tracker.dom_observer_map = {};
    $.each(api.tracker.dom_observers, function(act,config){
      if(!$.isArray(config.class)) config.class = [config.class];
      $.each(config.class, function(idx, className) {
        api.tracker.dom_observer_map[className] = act;
      })
    });
    //console.log( 'observer_config', api.tracker.dom_observers, 'dom_observer_map', api.tracker.dom_observer_map);
  };

  /**
   允许应用程序注册具体到他们的应用程序定制的DOM观察者。
    它增加了配置的DOM观察员和由DOM插入观察员支持
    这种方法可以称为两种不同的方式:
    Args:
      action - 新的DOM观察者的名字
      className / args - 一个简单的观察，这ARG可以简单地将标识此事件应该是一个插入的DOM元素的类
        triggered.对于更复杂的观察者，这可以是包含用于每个支持的DOM观察者配置参数属性的对象
      parent - optional -如果指定，这个观测器将被注册为指定的父子观察者
   */
  api.observe.register = function(action, args, parent) {

    // 配置检查观察家
    if (api.tracker.dom_observer_init) {
      api.tools.error('Error: Please register all custom DOM observers before binding handlers using gmail.observe.on etc');
    }
    if (!api.tracker.custom_supported_observers) {
      api.tracker.custom_supported_observers = [];
      api.tracker.custom_dom_observers = {};
    }

    //在参数对象传递，或者只是一个类名
    var config = {};
    if (typeof args == 'object' && !$.isArray(args)) {

      //拷贝过来支持配置
      $.each(['class','selector','sub_selector','handler'], function(idx, arg) {
        if(args[arg]) {
          config[arg] = args[arg];
        }
      });
    } else {
      config['class'] = args;
    }
    api.tracker.custom_supported_observers.push(action);
    if (parent) {
      if (!api.tracker.custom_dom_observers[parent]) {
        api.tracker.custom_dom_observers[parent] = {sub_observers: {}};
      }
      api.tracker.custom_dom_observers[parent].sub_observers[action] = config;
    } else {
      api.tracker.custom_dom_observers[action] = config;
    }
  };

  /**
   观察节点插入DOM。当与类中api.tracker.dom_observers中定义的节点插入，
    触发相关的事件和火灾关闭任何相关的绑定回调
    如果一个DOM观测发现指定操作，此功能应返回true
   */
  api.observe.on_dom = function(action, callback) {

    // 配置检查观察家
    if(!api.tracker.dom_observer_init) {
      api.observe.initialize_dom_observers();
    }

    // 对于DOM观察家的支持
    if($.inArray(action, api.tracker.supported_observers) > -1) {

      //console.log('observer found',api.tracker.dom_observers[action]);

      //如果我们还没有绑定的DOM插入观察者，现在就做
      if(!api.tracker.observing_dom) {
        api.tracker.observing_dom = true;
        //api.tracker.dom_watchdog = {}; //店内通过观察者的回调，不同的DOM事件

      //这个监听器会检查插入到DOM的每一个元素
        //对于指定的类（如api.tracker.dom_observers上述定义），其指示
        //这就需要触发//相关行动
        $(window.document).bind('DOMNodeInserted', function(e) {
          api.tools.insertion_observer(e.target, api.tracker.dom_observers, api.tracker.dom_observer_map);
        });

        // recipient_change 还需要听取清除
        var mutationObserver = new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            var removedNodes = mutation.removedNodes;
            for (var j = 0; j < removedNodes.length; j++) {
              var removedNode = removedNodes[j];
              if (removedNode.className == 'vR') {
                var observer = api.tracker.dom_observer_map['vR'];
                var handler = api.tracker.dom_observers.recipient_change.handler;
                api.observe.trigger_dom(observer, $(mutation.target), handler);
              }
            }
          }
        });
        mutationObserver.observe(document.body, {subtree: true, childList: true});

      }
      api.observe.bind('dom',action,callback);
      // console.log(api.tracker.observing_dom,'dom_watchdog is now:',api.tracker.dom_watchdog);
      return true;

    //对于Gmail界面加载事件支持
    } else if(action == 'load') {

     //等到Gmail界面加载完成，然后
      //执行传递的处理程序。如果接口已经加载，
      //那么只会执行回调
      if(api.dom.inbox_content().length) return callback();
      var load_count = 0;
      var delay = 200; // 200ms per check
      var attempts = 50; //放弃与假设错误之前尝试50次
      var timer = setInterval(function() {
        var test = api.dom.inbox_content().length;
        if(test > 0) {
          clearInterval(timer);
          return callback();
        } else if(++load_count > attempts) {
          clearInterval(timer);
          console.log('Failed to detect interface load in ' + (delay*attempts/1000) + ' seconds. Will automatically fire event in 5 further seconds.');
          setTimeout(callback, 5000);
        }
      }, delay);
      return true;
    }
  };

  //通过Gmail的观察插入到DOM的每一个元素，并着眼于对这些元素的类，
  //为相关的那些类的任何配置观察家检查
  api.tools.insertion_observer = function(target, dom_observers, dom_observer_map, sub) {
    //console.log('insertion', target, target.className);
    if(!api.tracker.dom_observer_map) return;

    //遍历每个插入的元素类和的检查上一个类定义的观察者
    var cn = target.className || '';
    var classes = cn.trim().split(/\s+/);
    if(!classes.length) classes.push(''); // 如果没课，然后检查没有任何类节点观察
    $.each(classes, function(idx, className) {
      var observer = dom_observer_map[className];

      // 检查，如果这是一个定义的观察者，和回调都绑定到观察者
      if(observer && api.tracker.watchdog.dom[observer]) {
        var element = $(target);
        var config = dom_observers[observer];

        // 如果这个观察者指定的配置ID，请确保该元素相匹配
        if(config.selector && !element.is(config.selector)) {
          return;
        }

       //检查任何定义的子选择器匹配 - 如果没有找到，那么这是不是这个观察者//如果找到了匹配，然后将匹配的元素是相匹配的一 sub_selector
        if(config.sub_selector) {
          element = element.find(config.sub_selector);
          // console.log('checking for subselector', config.sub_selector, element);
        }

        // 如果一个元素已经发现，执行观察者处理器（或者如果没有定义，执行回调）
        if(element.length) {

          var handler = config.handler ? config.handler : function(match, callback) { callback(match) };
          // console.log( 'inserted DOM: class match in watchdog',observer,api.tracker.watchdog.dom[observer] );
          api.observe.trigger_dom(observer, element, handler);

          //如果子观察员配置此观察者，一个DOMNodeInserted监听绑定到这个元素和检查特定的元素被添加到这个特殊的元素
          if(config.sub_observers) {

            //创建观察者地图 sub_observers
            var observer_map = {};
            $.each(config.sub_observers, function(act,cfg){
              observer_map[cfg.class] = act;
            });

       //这个监听器会检查插入到当前元素下的DOM的每一个元素
            //并重复这一方法，但具体是当前元素下方，而不是全球DOM
            element.bind('DOMNodeInserted', function(e) {
              api.tools.insertion_observer(e.target, config.sub_observers, observer_map, 'SUB ');
            });
          }
        }
      }
    });
  };


  api.tools.make_request = function (_link, method) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method  = (typeof method == undefined || typeof method == null) ? 'GET' : method;

    link = encodeURI(link).replace(/#-#-#/gi, "%23");
    var request = $.ajax({ type: method, url: link, async:false });

    return request.responseText;
  };


  api.tools.make_request_async = function (_link, method, callback) {
    var link = decodeURIComponent(_link.replace(/%23/g, "#-#-#"));
    method  = (typeof method == undefined || typeof method == null) ? 'GET' : method;

    link = encodeURI(link).replace(/#-#-#/gi, "%23");
    $.ajax({ type: method, url: link, async:true, dataType: 'text' })
        .done(function(data, textStatus, jqxhr) {
          callback(jqxhr.responseText);
        })
        .fail(function(jqxhr, textStatus, errorThrown) {
          console.error('Request Failed', errorThrown);
        });
  };


  api.tools.parse_view_data = function(view_data) {
    var parsed = [];
    var data = [];

    for(var j=0; j < view_data.length; j++) {
      if(view_data[j][0] == 'tb') {
        for(var k=0; k < view_data[j][2].length; k++) {
          data.push(view_data[j][2][k]);
        }
      }
    }

    for(var i=0; i < data.length; i++) {
      var x = data[i];
      var temp = {};

      parsed.push({
        id: x[0],
        title : x[9],
        excerpt : x[10],
        time : x[15],
        sender : x[28],
        attachment : x[13],
        labels: x[5]
      });
    }

    return parsed;
  };


  api.helper.get.is_delegated_inbox = function() {
    return api.tracker.globals[17][5][0] === 'fwd';
  };


  api.helper.get.visible_emails_pre = function() {
    var page = api.get.current_page();
    var url = window.location.origin + window.location.pathname + '?ui=2&ik=' + api.tracker.ik+'&rid=' + api.tracker.rid + '&view=tl&num=120&rt=1';
    if (!!$('.Dj:visible').find("b:first").text()) {
      url += '&start=' + + parseInt($('.Dj:visible').find("b:first").text() - 1) + 
        '&start=' + parseInt($('.Dj:visible').find("b:first").text() - 1);
    } else {
      url += '&start=0';
    }
    
    if(page.indexOf('label/') == 0) {
      url += '&cat=' + page.split('/')[1] +'&search=cat';
    } else if(page.indexOf('category/') == 0) {
      var cat_label = "";

      if(page.indexOf('forums') != -1) {
        cat_label = 'group';
      } else if(page.indexOf('updates') != -1) {
        cat_label = 'notification';
      } else if(page.indexOf('promotion') != -1) {
        cat_label = 'promo';
      } else if(page.indexOf('social') != -1) {
        cat_label = 'social';
      }
      url += '&cat=^smartlabel_' + cat_label +'&search=category';
    } else if(page.indexOf('search/') == 0) {
      at = $('input[name=at]').val();
      url += '&qs=true&q=' + page.split('/')[1] +'&at=' + at + '&search=query';
    } else if(page == 'inbox'){
      if ($('div[aria-label="Social"]').attr('aria-selected') == 'true') {
        cat_label = 'social';
        url += '&cat=^smartlabel_' + cat_label + '&search=category';
      } else if ($('div[aria-label="Promotions"]').attr('aria-selected') == 'true') {
        cat_label = 'promo';
        url += '&cat=^smartlabel_' + cat_label + '&search=category';
      } else if ($('div[aria-label="Updates"]').attr('aria-selected') == 'true') {
        cat_label = 'notification';
        url += '&cat=^smartlabel_' + cat_label + '&search=category';
      } else if ($('div[aria-label="Forums"]').attr('aria-selected') == 'true') {
        cat_label = 'group';
        url += '&cat=^smartlabel_' + cat_label + '&search=category';
      } else {
        url += '&search=' + 'mbox';
      }
    }else {
      url += '&search=' + page;
    }
    return url;
  };


  api.helper.get.visible_emails_post = function(get_data) {
    var emails = [];

    if (!get_data) {
        return emails;
    }

    get_data = get_data.substring(get_data.indexOf('['), get_data.length);
    get_data = '"use strict"; return ' + get_data;
    get_data = new Function(get_data);

    api.tracker.view_data = get_data();

    for(var i in api.tracker.view_data) {
      if (typeof(api.tracker.view_data[i]) === 'function') {
        continue;
      }

      var cdata = api.tools.parse_view_data(api.tracker.view_data[i]);
      if(cdata.length > 0) {
        $.merge(emails, cdata);
      }
    }
    return emails;
  };


  api.get.visible_emails = function() {
    var url = api.helper.get.visible_emails_pre();
    var get_data = api.tools.make_request(url);
    var emails = api.helper.get.visible_emails_post(get_data);

    return emails;
  };


  api.get.visible_emails_async = function(callback) {
    var url = api.helper.get.visible_emails_pre();
    api.tools.make_request_async(url, 'GET', function(get_data) {
      var emails = api.helper.get.visible_emails_post(get_data);
      callback(emails);
    });
  };


  api.get.selected_emails_data = function(){
    var selected_emails = [];
    if(!api.check.is_inside_email()){
      if($('[gh="tl"] div[role="checkbox"][aria-checked="true"]').length){
        var email = null;
        var emails = api.get.visible_emails();
        $('[gh="tl"] div[role="checkbox"]').each(function(index){
          if($(this).attr('aria-checked') == "true"){
            email = api.get.email_data(emails[index].id);
            selected_emails.push(email);
          }
        });
      }
    }else {
      selected_emails.push(api.get.email_data());
    }
    return selected_emails;
  };

  api.get.current_page = function() {
    var hash  = window.location.hash.split('#').pop().split('?').shift() || 'inbox';
    var pages = ['sent', 'inbox', 'starred', 'drafts', 'imp', 'chats', 'all', 'spam', 'trash',
                 'settings', 'label', 'category', 'circle', 'search'];

    var page = null;

    if($.inArray(hash, pages) > -1) {
      page = hash;
    }

    if(hash.indexOf('inbox/') !== -1) {
      page = 'email';
    }
    else if(hash.match(/\/[0-9a-f]{16,}$/gi)) {
      page = 'email';
    }

    return page || hash;
  };


  api.tools.infobox = function(message, time, html){
    var top = $(".b8.UC");

   //初始Gmail的风格，我注意到在26/05/2014年为$（“b8.UC”。）：
    //风格=“的位置是：相对;顶部：-10000px;”
    //看来，当Gmail的显示信息框，样式简单地删除
    // - 从我可以DevTools元素面板中看到的

    if(top.length > 0){
      top.stop(false, true); //取消现有褪色，所以我们可以重新开始
      var info = top.find(".vh");
      if (!html) {
        info.text(message);
      } else {
        info.html(message);
      }
      if(typeof time !== "undefined"){
        var initialInfoboxStyle = top.attr("style");            // 备份的初始风格
        top.removeAttr("style").fadeTo(time, 0, function(){     // 只需删除然后恢复
          $(this).attr("style", initialInfoboxStyle);           // s类型属性，而不是打
        });                             // 对visibility属性
      }
      else{
        top.removeAttr("style");                    // dito
      }
    }
  };

  /**
   * 重新渲染利用现有的数据UI.
   *
   *这个方法_不_导致Gmail中获取新的数据。这个方法是有用
   *在那里的情况有Gmail中提供的数据，但马上不
   *渲染。`observe.after`可以使用时的Gmail已提取，以检测
   *相关数据。例如，刷新谈话在Gmail撷取后
   *它的数据:
   *
   *     gmail.observe.after('refresh', function(url, body, data, xhr) {
   *       if (url.view === 'cv') {
   *         gmail.tools.rerender();
   *       }
   *     });
   *
   * 如果回调传递，经过重新渲染完成后它会被调用.
   */
  api.tools.rerender = function(callback) {
    var url = window.location.href;
    var hash = window.location.hash;

 //获取Gmail中导航离开，然后返回到当前的URL重新渲染。我们保留
   // 从变化中，我们通过访问等效网址导航离开// UI：当前的URL与
    //散列的第一个参数剥离 ('#inbox/14a16fab4adc1456' -> '#/14a16fab4adc1456' 或
    // '#inbox' -> '#').
    var tempUrl;
    if (hash.indexOf('/') !== -1) {
      tempUrl = url.replace(/#.*?\//, '#/');
    } else {
      tempUrl = url.replace(/#.*/, '#');
    }
    window.location.replace(tempUrl);

    //返回到原来的网址0超时后强制Gmail中进行导航到临时网址.
    setTimeout(function() {
      window.location.replace(url);

     //出于某种原因，这两种替代上述操作创建一个历史条目（在测试
      //浏览器39.0.2171.71）。弹出来隐藏我们的URL处理。
      window.history.back();

      if (callback) callback();
    }, 0);
  };

  api.tools.get_reply_to = function(ms13) {
    // reply to is an array if exists
    var reply_to = (ms13 != undefined) ? ms13[4] : [];

    //如果回复设置从中获得邮件，并将其返回
    if (reply_to.length !== 0) {
      return api.tools.extract_email_address(reply_to[0]);
    }

    // 否则返回null
    return null;
  };

  api.tools.parse_email_data = function(email_data) {
    var data = {};
    var threads = {};

    for(var i in email_data) {
      var x = email_data[i];
      if(x[0] == 'cs') {
        data.thread_id = x[1];
        data.first_email= x[8][0];
        data.last_email = x[2];
        data.total_emails = x[3];
        data.total_threads = x[8];
        data.people_involved = x[15];
        data.subject = x[23];
      }

      if(x[0] == 'ms') {
        if(data.threads == undefined) {
          data.threads = {};
        }

        data.threads[x[1]] = {};
        data.threads[x[1]].is_deleted = x[13] == undefined;
        data.threads[x[1]].reply_to_id = x[2];
        data.threads[x[1]].from = x[5];
        data.threads[x[1]].from_email = x[6];
        data.threads[x[1]].timestamp = x[7];
        data.threads[x[1]].datetime = x[24];
        data.threads[x[1]].attachments = x[21].split(',');
        data.threads[x[1]].subject = x[12];
        data.threads[x[1]].content_html = (x[13] != undefined) ? x[13][6] : x[8];
        data.threads[x[1]].to = (x[13] != undefined) ? x[13][1] : ((x[37] != undefined) ? x[37][1]:[]);
        data.threads[x[1]].cc = (x[13] != undefined) ? x[13][2] : [];
        data.threads[x[1]].bcc = (x[13] != undefined) ? x[13][3] : [];
        data.threads[x[1]].reply_to = api.tools.get_reply_to(x[13]);

        try { //jQuery将有时无法解析X [13] [6]，如果是这样，把原始的HTML
          data.threads[x[1]].content_plain = (x[13] != undefined) ? $(x[13][6]).text() : x[8];
        }
        catch(e) {
          data.threads[x[1]].content_plain = (x[13] != undefined) ? x[13][6] : x[8];
        }
      }
    }

    return data;
  };


  api.helper.get.email_data_pre = function(email_id) {
    if(api.check.is_inside_email() && email_id == undefined) {
      email_id = api.get.email_id();
    }

    var url = null;
    if(email_id != undefined) {
      url = window.location.origin + window.location.pathname + '?ui=2&ik=' + api.tracker.ik + '&rid=' + api.tracker.rid + '&view=cv&th=' + email_id + '&msgs=&mb=0&rt=1&search=mbox';
    }
    return url;
  };


  api.helper.get.email_data_post = function(get_data) {
    if (!get_data) {
        return {};
    }
    get_data = get_data.substring(get_data.indexOf('['), get_data.length);
    get_data = '"use strict"; return ' + get_data;
    get_data = new Function(get_data);

    var cdata = get_data();

    api.tracker.email_data = cdata[0];
    return api.tools.parse_email_data(api.tracker.email_data);
  };


  api.get.email_data = function(email_id) {
    var url = api.helper.get.email_data_pre(email_id);

    if (url != null) {
      var get_data = api.tools.make_request(url);
      var email_data = api.helper.get.email_data_post(get_data);
      return email_data;
    }

    return {};
  };


  api.get.email_data_async = function(email_id, callback) {
    var url = api.helper.get.email_data_pre(email_id);
    if (url != null) {
      api.tools.make_request_async(url, 'GET', function (get_data) {
        var email_data = api.helper.get.email_data_post(get_data);
        callback(email_data);
      });
    } else {
      callback({});
    }
  };


  api.helper.get.email_source_pre = function(email_id) {
    if(api.check.is_inside_email() && email_id == undefined) {
      email_id = api.get.email_id();
    }

    var url = null;
    if(email_id != undefined) {
      url = window.location.origin + window.location.pathname + '?ui=2&ik=' + api.tracker.ik + '&view=om&th=' + email_id;
    }

    return url;
  };


  api.get.email_source = function(email_id) {
    var url = api.helper.get.email_source_pre(email_id);
    if (url != null) {
      return api.tools.make_request(url);
    }
    return '';
  };


  api.get.email_source_async = function(email_id, callback) {
    var url = api.helper.get.email_source_pre(email_id);
    if (url != null) {
      api.tools.make_request_async(url, 'GET', callback);
    } else {
      callback('');
    }
  };


  api.get.displayed_email_data = function() {
    var email_data = api.get.email_data();
    var displayed_email_data = {};

    if (api.check.is_conversation_view()) {
      displayed_email_data = email_data;

      var threads = displayed_email_data.threads;
      var total_threads = displayed_email_data.total_threads;

      var hash = window.location.hash.split('#')[1] || '';
      var is_in_trash = (hash.indexOf('trash') === 0);

      for (var id in threads) {
        var email = threads[id];
        var keep_email = (is_in_trash) ? email.is_deleted : !email.is_deleted;

        if (!keep_email) {
          delete threads[id];
          total_threads.splice(total_threads.indexOf(id), 1);
          displayed_email_data.total_emails--;
          // TODO：只删除此电子邮件中涉及的人。
        }
      }
    }
    else { //假设只有一个显示电子邮件。
      for (id in email_data.threads) {
        var message_class_id = 'm'+id;
        var displayed_email_element = $('.ii.gt .a3s.aXjCH.' + message_class_id);

        if (displayed_email_element.length > 0) {
          var email = email_data.threads[id];

          displayed_email_data.first_email = id;
          displayed_email_data.last_email = id;
          displayed_email_data.subject = email_data.subject;

          displayed_email_data.threads = {};
          displayed_email_data.threads[id] = email;
          displayed_email_data.total_emails = 1;
          displayed_email_data.total_threads = [id];

          displayed_email_data.people_involved = [];

          displayed_email_data.people_involved.push(
            [email.from, email.from_email]
          );

          email.to.forEach(function(recipient) {
            var address = api.tools.extract_email_address(recipient);
            var name = api.tools.extract_name(recipient.replace(address, '')) || '';

            displayed_email_data.people_involved.push(
              [name, address]
            );
          });

          break;
        }
      }
    }

    return displayed_email_data;
  };


  api.check.is_conversation_view = function() {
    var flag_name = 'bx_vmb';
    var flag_value = undefined;

    var array_with_flag = api.tracker.globals[17][4][1];

    for (var i = 0; i < array_with_flag.length; i++) {
      var current = array_with_flag[i];

      if (current[0] === flag_name) {
        flag_value = current[1];

        break;
      }
    }

    return flag_value === '0' || flag_value === undefined;
  };


  api.tools.extract_email_address = function(str) {
    var regex = /[\+a-z0-9._-]+@[a-z0-9._-]+\.[a-z0-9._-]+/gi;
    var matches = (str) ? str.match(regex) : undefined;

    return (matches) ? matches[0] : undefined;
  };


  api.tools.extract_name = function(str) {
    var regex = /[a-z'._-\s]+/gi;
    var matches = (str) ? str.match(regex) : undefined;

    return (matches && matches[0]) ? matches[0].trim() : undefined;
  };


  api.tools.i18n = function(label) {
    var locale = api.get.localization();
    var dictionary;

    switch (locale) {
      case 'fr':
        dictionary = {
          'inbox': 'Boîte de réception',
          'drafts': 'Brouillons',
          'spam': 'Spam',
          'forums': 'Forums',
          'updates': 'Mises à jour',
          'promotions': 'Promotions',
          'social_updates': 'Réseaux sociaux'
        };
        break;

      case 'nl':
        dictionary = {
          'inbox': 'Postvak IN',
          'drafts': 'Concepten',
          'spam': 'Spam',
          'forums': 'Forums',
          'updates': 'Updates',
          'promotions': 'Reclame',
          'social_updates': 'Sociaal'
        };
        break;
     case 'cn':
        dictionary = {
          'inbox': '收件箱',
          'drafts': '草案',
          'spam': '垃圾邮件',
          'forums': '论坛',
          'updates': '更新',
          'promotions': '促销',
          'social_updates': '社交网络'
        };
        break;
      case 'en':
      default:
        dictionary = {
          'inbox': 'Inbox',
          'drafts': 'Drafts',
          'spam': 'Spam',
          'forums': 'Forums',
          'updates': 'Updates',
          'promotions': 'Promotions',
          'social_updates': 'Social Updates'
        };
        break;
    }

    return dictionary[label];
  };

  api.tools.add_toolbar_button = function(content_html, onClickFunction, styleClass) {
    var container = $(document.createElement('div'));
    container.attr('class','G-Ni J-J5-Ji');

    var button = $(document.createElement('div'));
    var buttonClasses = 'T-I J-J5-Ji lS ';
    if(styleClass != undefined &&
      styleClass != null &&
      styleClass != ''){
      buttonClasses += styleClass;
    }else{
      buttonClasses += 'T-I-ax7 ar7';
    }
    button.attr('class', buttonClasses);

    button.html(content_html);
    button.click(onClickFunction);

    var content = $(document.createElement('div'));
    content.attr('class','asa');

    container.html(button);

    api.dom.toolbar().append(container);

    return container;
  };

  api.tools.add_compose_button =  function(composeWindow, content_html, onClickFunction, styleClass) {
    var button = $(document.createElement('div'));
    var buttonClasses = 'T-I J-J5-Ji aoO L3 ';
    if(styleClass != undefined){
      buttonClasses += styleClass;
    }
    button.attr('class', buttonClasses);
    button.html(content_html);
    button.click(onClickFunction);

    composeWindow.find('.gU.Up  > .J-J5-Ji').append(button);

    return button;
  };

  api.tools.remove_modal_window = function() {
    $('#gmailJsModalBackground').remove();
    $('#gmailJsModalWindow').remove();
  };

  api.tools.add_modal_window = function(title, content_html, onClickOk, onClickCancel, onClickClose) {
    // 默认情况下，点击取消或关闭应清理模态窗口
    onClickClose = onClickClose || api.tools.remove_modal_window;
    onClickCancel = onClickCancel || api.tools.remove_modal_window;

    var background = $(document.createElement('div'));
    background.attr('id','gmailJsModalBackground');
    background.attr('class','Kj-JD-Jh');
    background.attr('aria-hidden','true');
    background.attr('style','opacity:0.75;width:100%;height:100%;');

    // 模式窗口包装
    var container = $(document.createElement('div'));
    container.attr('id','gmailJsModalWindow');
    container.attr('class', 'Kj-JD');
    container.attr('tabindex', '0');
    container.attr('role', 'alertdialog');
    container.attr('aria-labelledby', 'gmailJsModalWindowTitle');
    container.attr('style', 'left:50%;top:50%;opacity:1;');

    // 模式窗口标题内容
    var header = $(document.createElement('div'));
    header.attr('class', 'Kj-JD-K7 Kj-JD-K7-GIHV4');

    var heading = $(document.createElement('span'));
    heading.attr('id', 'gmailJsModalWindowTitle');
    heading.attr('class', 'Kj-JD-K7-K0');
    heading.attr('role', 'heading');
    heading.html(title);

    var closeButton = $(document.createElement('span'));
    closeButton.attr('id', 'gmailJsModalWindowClose');
    closeButton.attr('class', 'Kj-JD-K7-Jq');
    closeButton.attr('role', 'button');
    closeButton.attr('tabindex', '0');
    closeButton.attr('aria-label', 'Close');
    closeButton.click(onClickClose);

    header.append(heading);
    header.append(closeButton);

    // 模态窗口控件
    var contents = $(document.createElement('div'));
    contents.attr('id', 'gmailJsModalWindowContent');
    contents.attr('class', 'Kj-JD-Jz');
    contents.html(content_html);

    // 模态窗口控件
    var controls = $(document.createElement('div'));
    controls.attr('class', 'Kj-JD-Jl');

    var okButton = $(document.createElement('button'));
    okButton.attr('id', 'gmailJsModalWindowOk');
    okButton.attr('class', 'J-at1-auR J-at1-atl');
    okButton.attr('name', 'ok');
    okButton.text('OK');
    okButton.click(onClickOk);

    var cancelButton = $(document.createElement('button'));
    cancelButton.attr('id', 'gmailJsModalWindowCancel');
    cancelButton.attr('name', 'cancel');
    cancelButton.text('Cancel');
    cancelButton.click(onClickCancel);

    controls.append(okButton);
    controls.append(cancelButton);

    container.append(header);
    container.append(contents);
    container.append(controls);

    $(document.body).append(background);
    $(document.body).append(container);

    var center = function() {
      container.css({
        top: ($(window).height() - container.outerHeight()) / 2,
        left: ($(window).width() - container.outerWidth()) / 2
      });
    };

    center();

    $(window).resize(center);
  };

  api.chat.is_hangouts = function() {
    if(api.tracker.hangouts != undefined) {
      return api.tracker.hangouts;
    }

    // 如果用户使用视频群聊，而不是经典的聊天返回true
    var dwClasses = $(".dw");
    if(dwClasses.length > 1) {
      throw "Figuring out is hangouts - more than one dw classes found";
    }
    if(dwClasses.length == 0) {
      throw "Figuring out is hangouts - no dw classes found";
    }

    var dw = dwClasses[0];

    var chatWindows = $('.nH.aJl.nn', dw);
    if(chatWindows.length > 0) {
      //视频群聊
      api.tracker.hangouts = true;
      return true;
    }

    chatWindows = $('.nH.nn', dw);

    if(chatWindows.length > 2) {
      // 经典
      api.tracker.hangouts = false;
      return false;
    }
    return undefined;
  };

 //检索撰写窗口DOM对象的队列
  //在队列的开始最新撰写（索引0）
  api.dom.composes = function() {
    var objs = [];
    $('div.M9').each(function(idx, el) {
      objs.push( new api.dom.compose(el));
    });
    return objs;
  };

  /**
 着撰写对象。表示DOM中的撰写窗口，并提供了一系列的方法和属性来访问和交互的窗口，需要一个jQuery的DOM元素撰写DIV   */
  api.dom.compose = function(element) {
    element = $(element);
    if(!element || (!element.hasClass('M9') && !element.hasClass('AD'))) api.tools.error('api.dom.compose called with invalid element');
    this.$el = element;
    return this;
  };

  $.extend(api.dom.compose.prototype, {
    /**
      检索撰写ID
     */
    id: function() {
      return this.dom('id').val();
    },

    /**
    检索电子邮件ID草案
     */
    email_id: function() {
      return this.dom('draft').val();
    },

    /**
     这是撰写比如内联（与回复和转发）或弹出（与新撰写）
     */
    is_inline: function() {
      return this.$el.closest('td.Bu').length > 0;
    },

    /**
   检索到，CC，BCC和数组中的哈希返回它们
      参数：
        options.type字符串，抄送或密件抄送检查特定的一个
        options.flat布尔如果为true将只返回所有收件人的数组，而不是分裂出到收件人，抄送和密件抄送     */
    recipients: function(options) {
      if( typeof options != 'object' ) options = {};
      var name_selector = options.type ? '[name=' + options.type + ']' : '';

      // 确定要，CC和BCC和提取指定地址的所有电子邮件的数组回调对象
      var recipients = options.flat ? [] : {};
      this.$el.find('.GS input[type=hidden]'+name_selector).each(function(idx, recipient ){
        if(options.flat) {
          recipients.push(recipient.value);
        } else {
          if(!recipients[recipient.name]) recipients[recipient.name] = [];
          recipients[recipient.name].push(recipient.value);
        }
      });
      return recipients;
    },

    /**
    检索当前“到”收件人
     */
    to: function(to) {
      return this.dom('to').val(to);
    },

    /**
      检索当前“cc”收件人
     */
    cc: function(cc) {
      return this.dom('cc').val(cc);
    },

    /**
      检索当前的“密件抄送”收件人
     */
    bcc: function(bcc) {
      return this.dom('bcc').val(bcc);
    },

    /**
      Get/Set当前主题
      参数:
        主题字符串设定为新的主题
     */
    subject: function(subject) {
      var el = this.dom('subjectbox');
      if(subject) this.dom('all_subjects').val(subject);
      subject = this.dom('subjectbox').val();
      return subject ? subject : this.dom('subject').val();
    },

    /**
      获取从电子邮件
      如果用户只有他们可以发送一个电子邮件帐户，返回的电子邮件地址
      */
    from: function() {
      var el = this.dom('from');
      if (el.length) {
        var fromNameAndEmail = el.val();
        if (fromNameAndEmail) {
          return gmail.tools.extract_email_address(fromNameAndEmail);
        }
      }
      return gmail.get.user_email();
    },

    /**
      Get/Set 电子邮件正文
     */
    body: function(body) {
      var el = this.dom('body');
      if(body) el.html(body);
      return el.html();
    },

    /**
      地图通过发现jQuery的元素
     */
    find: function(selector) {
      return this.$el.find(selector);
    },

    /**
    获取此撰写窗口预配置的DOM元素
     */
    dom: function(lookup) {
      if (!lookup) return this.$el;
      var config = {
        to:'textarea[name=to]',
        cc:'textarea[name=cc]',
        bcc:'textarea[name=bcc]',
        id: 'input[name=composeid]',
        draft: 'input[name=draft]',
        subject: 'input[name=subject]',
        subjectbox: 'input[name=subjectbox]',
        all_subjects: 'input[name=subjectbox], input[name=subject]',
        body: 'div[contenteditable=true]',
        reply: 'M9',
        forward: 'M9',
        from: 'input[name=from]'
      };
      if(!config[lookup]) api.tools.error('Dom lookup failed. Unable to find config for \'' + lookup + '\'',config,lookup,config[lookup]);
      return this.$el.find(config[lookup]);
    }

  });

  /**
    对于目前存在的DOM中的电子邮件交互的对象。表示一个线程中的单个电子邮件
    提供访问和与它相互作用的数目的方法和属性
    预计，电子邮件格（div.adn由“view_email”观察者返回）一个jQuery DOM元素，或 email_id
   */
  api.dom.email = function(element) {
    if (typeof element == 'string') {
      this.id = element;
      var message_class_id = 'm' + this.id;
      this.id_element = $('div.ii.gt div.a3s.aXjCH.' + message_class_id);
      element = this.id_element.closest('div.adn');
    } else {
      element = $(element);
    }
    if (!element || (!element.hasClass('adn'))) api.tools.error('api.dom.email called with invalid element/id');

    //如果没有指定编号，从所述主体包装类提取物（始于随后的ID的“m”）
    if (!this.id) {
      this.id_element = element.find('div.ii.gt div.a3s.aXjCH');
      var classValue = this.id_element.attr('class');
      if (classValue != null) {
        var matches = classValue.match(/(^|\s)m([\S]*)/);
        if (matches !== null) {
          this.id = matches.pop();
        }
      }
    }
    this.$el = element;
    return this;
  };

  $.extend(api.dom.email.prototype, {

    /**
      获取/因为它坐落在DOM将完整的电子邮件体
      如果你想实际的DOM元素使用 .dom('body');
      注：这得与套在身上HTML它已被解析及通过GMAIL标记后。作为它的电子邮件消息源中是否存在检索，使用一个电话 .data();
     */
    body: function(body) {
      var el = this.dom('body');
      if (body) {
        el.html(body);
      }
      return el.html();
    },

    /**
    获取/设置发件人
      可选接收电子邮件和名称的属性。如果接收到在DOM更新的值
      返回包含发件人和DOM元素的电子邮件和名称的对象
     */
    from: function(email, name) {
      var el = this.dom('from');
      if (email) {
        el.attr('email',email);
      }
      if (name) {
        el.attr('name',name);
        el.html(name);
      }
      return {
        email: el.attr('email'),
        name: el.attr('name'),
        el: el
      };
    },

    /**
     获取/设置谁是电子邮件显示为要
      可选收到包含电子邮件和/或name属性的对象。如果收到更新的值在DOM。
      可选接收到这些物体，如果多个收件人的数组
      返回包含谁在DOM显示的电子邮件和名字对象数组作为电子邮件是
     */
    to: function(to_array) {

      //如果更新数据已passeed，通过循环和创建一个新的to_wrapper内容
      if (to_array) {
        if (!$.isArray(to_array)) {
          to_array = [to_array];
        }
        var html = [];
        $.each(to_array, function(index, obj) {
          html.push( $('<span />').attr({
            dir: 'ltr',
            email: obj.email,
            name: obj.name
          }).addClass('g2').html(obj.name).wrap('<p/>').parent().html());
        });
        this.dom('to_wrapper').html('to ' + html.join(', '));
      }


      // 循环通过任何匹配的元素，并准备输出
      var out = new Array();

      this.dom('to').each(function(index) {
        el = $(this);
        out.push({
          email:  el.attr('email'),
          name: el.attr('name'),
          el: el
        });
      });
      return out;
    },

    /**
    检索相关的邮件从Gmail服务器的邮件
    利用的 gmail.get.email_data() 方法
    返回一个对象
     */
    data: function() {
      if (typeof api.dom.email_cache != 'object') {
        api.dom.email_cache = {};
      }
      if (!api.dom.email_cache[this.id]) {

        // 为这整个邮件的线程检索和缓存数据
        var data = api.get.email_data(this.id);
        $.each(data.threads, function(email_id, email_data) {
          api.dom.email_cache[email_id] = email_data;
        });
      }
      return api.dom.email_cache[this.id];
    },

    /**
    检索电子邮件源来自Gmail的服务器中，该邮件利用了 gmail.get.email_source()方法返回的电子邮件原料来源的字符串
     */
    source: function() {
      return api.get.email_source(this.id);
    },

    /**
     预先配置的DOM元素检索此电子邮件
     */
    dom: function(lookup) {
      if (!lookup) return this.$el;
      var config = {
        body: 'div.a3s',
        from: 'span[email].gD',
        to: 'span[email].g2',
        to_wrapper: 'span.hb',
        timestamp: 'span.g3',
        star: 'div.zd',

        //按钮
        reply_button: 'div[role=button].aaq',
        menu_button: 'div[role=button].aap',
        details_button: 'div[role=button].ajz'
      };
      if(!config[lookup]) api.tools.error('Dom lookup failed. Unable to find config for \'' + lookup + '\'');
      return this.$el.find(config[lookup]);
    }

  });

  /**
    对于一个电子邮件目前在DOM交互对象。表示会话线程
    提供了一些方法和属性来访问和与它进行交互
    预计该线程的容器div的jQuery DOM元素（div.if由“view_thread的观察员返回)
   */
  api.dom.thread = function(element) {
    if (!element || (!element.hasClass('if'))) api.tools.error('api.dom.thread called with invalid element/id');
    this.$el = element;
    return this;
  };

  $.extend(api.dom.thread.prototype, {

    /**
     预先配置的DOM元素检索此电子邮件
     */
    dom: function(lookup) {
      if (!lookup) return this.$el;
      var config = {
        opened_email: 'div.adn',
        subject: 'h2.hP',
        labels: 'div.hN'
      };
      if(!config[lookup]) api.tools.error('DOM查找失败。无法找到配置 \'' + lookup + '\'');
      return this.$el.find(config[lookup]);
    }

  });

 /**
  *  显示一个组合窗口
  * @returns {boolean}
  */
  api.compose.start_compose = function() {

    //撰写按钮
    var composeEl = $('.T-I.J-J5-Ji.T-I-KE.L3')[0];

    if(composeEl) {
      //触发鼠标事件
      var mouseDown = document.createEvent('MouseEvents');
      mouseDown.initEvent( 'mousedown', true, false );
      composeEl.dispatchEvent(mouseDown);

      //触发鼠标事件
      var mouseUp = document.createEvent('MouseEvents');
      mouseUp.initEvent( 'mouseup', true, false );
      composeEl.dispatchEvent(mouseUp);

      return true;
    }
    return false;
  };

  return api;
};

if (!window.Gmail) {
  window.Gmail = initalizeOnce(Gmail_);
}

function initalizeOnce(fn) {
  var result;
  return function() {
    if (fn) {
      result = fn.apply(this, arguments);
    }
    fn = null;
    return result;
  }
}