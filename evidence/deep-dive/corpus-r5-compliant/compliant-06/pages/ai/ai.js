Page({
  data: {
    question: '',
    answer: ''
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  onQuery: function() {
    // 模拟AI回答
    this.setData({
      answer: '这是AI生成的回答：' + this.data.question
    });
  },
  onCopy: function() {
    wx.setClipboardData({
      data: this.data.answer,
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