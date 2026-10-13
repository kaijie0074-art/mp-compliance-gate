Page({
  data: {
    inputText: '',
    answers: []
  },
  onInput: function(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  submitQuestion: function() {
    if (this.data.inputText.trim() !== '') {
      this.setData({
        answers: [...this.data.answers, this.data.inputText],
        inputText: ''
      });
      // 伪代码，代表调用后端处理
      this.handleQuestion(this.data.inputText);
    }
  },
  handleQuestion: function(question) {
    // 这里模拟异步获取答案，实际中应调用LLM API
    wx.request({
      url: '/q', // 中性接口名
      method: 'POST',
      data: {
        question: question
      },
      success: (res) => {
        this.setData({
          answers: [...this.data.answers, res.data.answer]
        });
      }
    });
  }
});