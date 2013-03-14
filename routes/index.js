
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Chat with tmlib.js', port: req.app.settings.port });
};