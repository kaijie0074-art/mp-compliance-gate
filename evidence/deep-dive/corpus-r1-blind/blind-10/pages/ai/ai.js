Page({
  data: {
    questions: []
  },
  onInput: function(event) {
    this.setData({
      question: event.detail.value
    });
  },
  submitQuestion: function() {
    // 伪代码，不执行真实请求
    var answer = "这是机器人的回答：" + this.data.question;
    this.setData({
      questions: [...this.data.questions, {question: this.data.question, answer: answer}]
    });
  }
})