const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services');
const { SuccessResponse, ErrorResponse } = require('../utils/common')

const inMemDb = {};

async function createBooking(req, res) {
  try {
    const response = await BookingService.createBooking({
      flightId: req.body.flightId,
      userId: req.body.userId,
      noOfSeats: req.body.noOfSeats
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(error.statusCode).json(ErrorResponse);
  }
}

async function makePayment(req, res) {
  try {
    const idempotenceKey = req.headers['x-idempotence-key'];
    if(!idempotenceKey){
       return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Idempotence key missing'
      });
    }
    if(inMemDb[idempotenceKey]) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Cannot retry on a successful payment'
      });
    }
    const response = await BookingService.makePayment({
        totalCost: req.body.totalCost,
        userId: req.body.userId,
        bookingId: req.body.bookingId
    });
    inMemDb[idempotenceKey] = idempotenceKey;
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(error.statusCode).json(ErrorResponse);
  }
}

module.exports = {
    createBooking,
    makePayment
}