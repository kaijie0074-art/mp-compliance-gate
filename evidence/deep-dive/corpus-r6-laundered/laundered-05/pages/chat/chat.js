Page({
  data: {
    inputText: '',
    answer: '',
    showAnswer: false
  },
  onInput: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },
  submitQuery: function() {
    wx.request({
      url: '/q', // Neutral URL
      method: 'POST',
      data: {
        query: this.data.inputText
      },
      success: (res) => {
        this.setData({
          answer: res.data.reply,
          showAnswer: true
        });
      }
    });
  }
})