Page({
  data: {
    question: ''
  },
  methods: {
    bindInputQuestion: function(e) {
      this.setData({
        question: e.detail.value
      });
    },
    sendQuestion: function() {
      wx.request({
        url: 'http://example.com/ask',
        method: 'POST',
        data: {
          question: this.data.question
        },
        success: function(res) {
          wx.showToast({
            title: res.data.answer,
            icon: 'success'
          });
        },
        fail: function(err) {
          wx.showToast({
            title: '提交失败',
            icon: 'none'
          });
        }
      });
    }
  }
});