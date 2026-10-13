Page({
  data: {
    inputVal: ''
  },
  onInput: function(e) {
    this.setData({
      inputVal: e.detail.value
    });
  },
  sendMessage: function() {
    const input = this.data.inputVal;
    wx.cloud.callFunction({
      name: 'ai_assistant',
      data: {
        message: input
      },
      success: function(res) {
        const reply = res.result.reply;
        wx.showToast({
          title: reply,
          icon: 'none'
        });
      }
    });
  }
})