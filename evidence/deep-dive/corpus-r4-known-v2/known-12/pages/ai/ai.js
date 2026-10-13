Page({
  data: {
    inputVal: '',
    answer: ''
  },
  onInput: function(event) {
    this.setData({
      inputVal: event.detail.value
    });
  },
  send: function() {
    wx.cloud.callFunction({
      name: 'ai',
      data: {
        question: this.data.inputVal
      },
      success: res => {
        this.setData({
          answer: res.result answer
        });
      }
    });
  }
})