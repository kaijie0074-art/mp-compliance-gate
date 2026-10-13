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
  onSubmit: function() {
    wx.request({
      url: '/q', // 使用中性路径
      method: 'POST',
      data: {
        question: this.data.question
      },
      success: (res) => {
        this.setData({
          answer: res.data.response,
          showAnswer: true
        });
      }
    });
  }
});