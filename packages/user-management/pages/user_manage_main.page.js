import $ from 'jquery';
import { NamedPage } from 'vj/misc/Page';
import Notification from 'vj/components/notification';
import { request } from 'vj/utils';
import i18n from 'vj/utils/i18n';
import pjax from 'vj/utils/pjax';

const page = new NamedPage('user_management', () => {
  // 搜索功能
  $('#search-form').on('submit', function(e) {
    e.preventDefault();
    const search = $('#search-keyword').val().trim();
    const sort = $('#sort-by').val();
    
    let url = window.location.pathname + '?';
    const params = [];
    
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    if (sort) {
      params.push(`sort=${sort}`);
    }
    
    url += params.join('&');
    pjax.request({ url });
  });
  
  // 清空搜索
  $('#clear-search').on('click', function() {
    $('#search-keyword').val('');
    $('#sort-by').val('_id');
    pjax.request({ url: window.location.pathname });
  });
  
  // 快速封禁/解封用户
  $('.ban-user').on('click', async function(e) {
    e.preventDefault();
    const uid = $(this).data('uid');
    const username = $(this).data('username');
    const action = $(this).data('action');
    
    const confirmMessage = action === 'ban'
      ? i18n('Are you sure to ban user {0}?', username)
      : i18n('Are you sure to unban user {0}?', username);
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await request.post(`/manage/users/${uid}`, {
        operation: action === 'ban' ? 'ban' : 'unban'
      });
      
      if (response.success) {
        Notification.success(action === 'ban' ? i18n('User banned successfully') : i18n('User unbanned successfully'));
        // 刷新页面
        window.location.reload();
      } else {
        Notification.error(response.message || i18n('Operation failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      Notification.error(i18n('Operation failed'));
    }
  });
  
  // 快速设置权限
  $('.set-priv').on('click', async function(e) {
    e.preventDefault();
    const uid = $(this).data('uid');
    const username = $(this).data('username');
    const currentPriv = $(this).data('priv');
    
    const newPriv = prompt(i18n('Enter new privilege value for user {0}:', username), currentPriv);
    if (newPriv === null || newPriv === '') {
      return;
    }
    
    const privValue = parseInt(newPriv, 10);
    if (isNaN(privValue)) {
      Notification.error(i18n('Invalid privilege value'));
      return;
    }
    
    if (!confirm(i18n('Are you sure to set privilege of user {0} to {1}?', username, privValue))) {
      return;
    }
    
    try {
      const response = await request.post(`/manage/users/${uid}`, {
        operation: 'setPriv',
        priv: privValue
      });
      
      if (response.success) {
        Notification.success(i18n('Privilege updated successfully'));
        // 刷新页面
        window.location.reload();
      } else {
        Notification.error(response.message || i18n('Operation failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      Notification.error(i18n('Operation failed'));
    }
  });
  
  // 分页链接处理
  $('.pagination a').on('click', function(e) {
    e.preventDefault();
    const url = $(this).attr('href');
    if (url && url !== '#') {
      pjax.request({ url });
    }
  });
  
  // 刷新按钮
  $('#refresh-list').on('click', function() {
    window.location.reload();
  });
  
  // 键盘快捷键
  $(document).on('keydown', function(e) {
    // Ctrl+F 聚焦搜索框
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      $('#search-keyword').focus();
    }
    
    // Enter 键提交搜索
    if (e.key === 'Enter' && $('#search-keyword').is(':focus')) {
      $('#search-form').submit();
    }
  });
  
  // 初始化提示
  $('[data-tooltip]').each(function() {
    $(this).attr('title', $(this).data('tooltip'));
  });
});

export default page;