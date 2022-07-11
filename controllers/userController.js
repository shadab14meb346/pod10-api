const User = require('../models/User');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const axios = require('axios');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
      users,
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  if (!newUser)
    return next(
      new AppError(`
      Can't create user due to invalid details, 400
      `)
    );

  res.status(200).json({
    status: 'success',
    user: newUser,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
//   const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
      user: updatedUser,
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user)
    return next(
      new AppError(`No User found against id ${req.params.id}`, 404)
    );

  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);

  if (!deletedUser)
    return next(
      new AppError(`No User found against id ${req.params.id}`, 404)
    );

  res.status(200).json({
    status: 'success',
    user: deletedUser,
  });
});

exports.getKeywords = catchAsync(async (req, res, next) => {

  const username = req.query['username']
  const userdetails = await axios.get(
    `https://api.twitter.com/2/users/by/username/${username}`, {
    headers: { 
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPhjWAEAAAAA0s%2FWHeOO%2BvP96lKjfw6uZBgWCzI%3DAj6em26R9yL15TuETqDuXYVphaLRGFnTPgWKZtm3puPWjfTx04', 
    }
  }
  );
  const userId = userdetails.data['data']['id']

  const response = await axios.get(
    `https://api.twitter.com/2/tweets/search/recent?query=from%3A%20${username}&tweet.fields=author_id`, {
    headers: { 
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPhjWAEAAAAA0s%2FWHeOO%2BvP96lKjfw6uZBgWCzI%3DAj6em26R9yL15TuETqDuXYVphaLRGFnTPgWKZtm3puPWjfTx04', 
      'Cookie': 'guest_id=v1%3A165754080682838762; guest_id_ads=v1%3A165754080682838762; guest_id_marketing=v1%3A165754080682838762; personalization_id="v1_Sy1q3AX5HK750dL3bNbuVg=="'
    }
  }
  );

  const userLists = await axios.get(
    `https://api.twitter.com/2/users/${userId}/followed_lists`, {
    headers: { 
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPhjWAEAAAAA0s%2FWHeOO%2BvP96lKjfw6uZBgWCzI%3DAj6em26R9yL15TuETqDuXYVphaLRGFnTPgWKZtm3puPWjfTx04', 
    }
  }
  );
  console.log(userLists.data);

  var tweetText = "";
  const data = response.data['data']
  for (let key in data) {
    tweetText += data[key]['text'];
  }

  var userListsText = "";
  const userListsData = userLists.data['data']
  for (let key in userListsData) {
    userListsText += `${userListsData[key]['name']},`;
  }



  const keywordResponse = await axios.post(
    "https://api.apilayer.com/keyword", tweetText, {
      headers: {
        'apikey': 'U7jh7bCRgLBhBjrHB0xJ02XzeVcd4Q77'
      },
    }
  )

  res.status(200).json({
    status: 'success',
    data: {
      'tweetKeywords': keywordResponse.data,
      'userLists': userListsText
    }
  });
});
