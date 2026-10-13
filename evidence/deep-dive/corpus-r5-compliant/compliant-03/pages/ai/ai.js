Page({
  data: {
    question: '',
    answer: ''
  },
  onInput: function(e) {
    this.setData({
      question: e.detail.value
    });
  },
  askAI: function() {
    const question = this.data.question;
    wx.request({
      url: 'https://api.example.com/ai-answer', // 假设的API接口
      method: 'POST',
      data: { question: question },
      success: (res) => {
        this.setData({
          answer: res.data.answer
        });
      }
    });
  },
  copyAnswer: function() {
    const answer = this.data.answer;
    wx.setClipboardData({
      data: answer,
      success: function() {
        wx.showToast({
          title: '已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  }
})