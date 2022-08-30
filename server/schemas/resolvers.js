require("dotenv").config();
const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
      //get a user by username
      user: async (parent, args, context) => {
        if (context.user) {
          const userData = await User.findOne({ _id: context.user._id })
            .select("-__v -password")
            .populate("books");
  
          return userData;
        }
  
        throw new AuthenticationError("You are not logged in");
      },
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
          
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
          
            if (!user) {
              throw new AuthenticationError('User does not exsist');
            }
          
            const correctPw = await user.isCorrectPassword(password);
          
            if (!correctPw) {
              throw new AuthenticationError('Incorrect password');
            }
          
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { book }, context) => {
            if (context.user) {          
              const user= await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $addToSet: { savedBooks: book } },
                { new: true }
              );
          
              return user;
            }
          
            throw new AuthenticationError('You need to log in first!');
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {          
                const user= await User.findByIdAndUpdate(
                  { _id: context.user._id },
                  { $pull: { savedBooks: {bookId: bookId} } },
                  { new: true }
                );
            
                return user;
            }

              throw new AuthenticationError('You need to log in first!');
            
        }
    }

};
  
module.exports = resolvers;