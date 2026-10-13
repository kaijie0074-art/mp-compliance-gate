Page({
  data: {
    messages: [],
    inputText: ''
  },
  onInput: function(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  submitQuestion: function() {
    const question = this.data.inputText;
    if (question) {
      wx.request({
        url: '/q',
        method: 'POST',
        data: { question: question },
        success: (res) => {
          this.setData({
            messages: [...this.data.messages, res.data.answer]
          });
        }
      });
    }
  }
})