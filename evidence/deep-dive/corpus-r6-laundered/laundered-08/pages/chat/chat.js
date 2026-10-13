Page({
  data: {
    messages: [],
    question: ""
  },
  onInput: function(e) {
    this.setData({ question: e.detail.value });
  },
  submitQuestion: function() {
    if (this.data.question) {
      this.setData({
        messages: [...this.data.messages, { text: this.data.question, isSelf: true }],
        question: ""
      });
      this.generateResponse(this.data.question);
    }
  },
  generateResponse: function(question) {
    wx.request({
      url: 'https://example.com/q',
      method: 'POST',
      data: { question: question },
      success: (res) => {
        this.setData({
          messages: [...this.data.messages, { text: res.data.answer, isSelf: false }]
        });
      }
    });
  },
  isSelf: function(message) {
    return message.isSelf;
  }
});