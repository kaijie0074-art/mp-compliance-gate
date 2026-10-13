Page({
  data: {
    inputVal: ''
  },
  onInput: function(e) {
    this.setData({
      inputVal: e.detail.value
    });
  },
  onSend: function() {
    const inputVal = this.data.inputVal;
    wx.cloud.callFunction({
      name: 'aiChat',
      data: {
        message: inputVal
      },
      success: res => {
        console.log(res.result);
        this.setData({
          inputVal: ''
        });
      },
      fail: err => {
        console.error(err);
      }
    });
  }
})