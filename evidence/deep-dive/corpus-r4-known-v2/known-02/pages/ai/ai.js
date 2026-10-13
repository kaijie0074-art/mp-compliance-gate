Page({
  data: {
    inputText: '',
    aiResult: ''
  },
  onInput: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  onSubmit: function() {
    const input = this.data.inputText;
    wx.cloud.callFunction({
      name: 'aiFunction',
      data: {
        text: input
      },
      success: res => {
        this.setData({
          aiResult: res.result.text
        });
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
  }
})