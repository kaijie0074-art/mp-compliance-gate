Page({
  data: {
    question: '',
    answer: '',
    showAnswer: false
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  submitQuestion: function() {
    if (this.data.question.trim() !== '') {
      wx.request({
        url: 'https://your-api-endpoint.com/ask',
        method: 'POST',
        data: {
          question: this.data.question
        },
        success: (res) => {
          this.setData({
            answer: res.data.answer,
            showAnswer: true
          });
        }
      });
    }
  }
})