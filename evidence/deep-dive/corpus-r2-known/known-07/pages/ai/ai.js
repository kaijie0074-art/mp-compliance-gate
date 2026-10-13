Page({
  data: {
    inputText: '',
    answer: ''
  },
  onInput: function(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  send: function() {
    wx.request({
      url: 'https://api.example.com/ai',
      method: 'POST',
      data: {
        question: this.data.inputText
      },
      success: (res) => {
        this.setData({
          answer: res.data.answer
        });
      }
    });
  }
})