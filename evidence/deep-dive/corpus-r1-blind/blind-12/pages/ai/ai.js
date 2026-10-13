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
  onAsk: function() {
    // 这里是伪代码，实际调用时将执行AI问答逻辑
    wx.request({
      url: 'https://example.com/api/ask', // 明文HTTP接口，真实场景会被微信拒审
      method: 'POST',
      data: {
        question: this.data.question
      },
      success: (res) => {
        this.setData({
          answer: res.data.answer
        });
      }
    });
  }
})