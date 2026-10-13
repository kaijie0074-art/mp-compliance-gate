Page({
  data: {
    inputText: '',
    responseContent: '',
    showResponse: false
  },
  onInput: function(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  onSubmit: function() {
    const input = this.data.inputText;
    if (input) {
      wx.request({
        url: '/q',
        method: 'POST',
        data: { query: input },
        success: (res) => {
          this.setData({
            responseContent: res.data.answer,
            showResponse: true
          });
        }
      });
    }
  }
});