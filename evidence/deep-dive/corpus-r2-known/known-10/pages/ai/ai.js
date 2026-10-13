Page({
  data: {
    question: ''
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  onSubmit: function() {
    wx.setClipboardData({
      data: this.data.question,
      success: function() {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000
        });
      }
    });
  }
})