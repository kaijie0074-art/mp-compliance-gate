Page({
  data: {
    question: '',
    answer: ''
  },
  onQueryInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  onAskQuestion: function() {
    const question = this.data.question;
    // Placeholder for AI processing
    this.setData({
      answer: `AI的回答: ${question}`
    });
  }
})