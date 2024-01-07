function userValidator(ctx, next) {
  if (ctx.message.from.id !== global.userId) {
    ctx.reply("ти хто");
    return;
  } else {
    return next();
  }
}

module.exports = {
  userValidator,
};
