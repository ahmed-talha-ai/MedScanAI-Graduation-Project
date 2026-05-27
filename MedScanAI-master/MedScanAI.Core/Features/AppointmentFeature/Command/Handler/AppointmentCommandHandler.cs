using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.AppointmentFeature.Command.Model;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.AppointmentFeature.Command.Handler
{
    public class AppointmentCommandHandler :
        IRequestHandler<BookAppointmentCommand, ReturnBase<bool>>,
        IRequestHandler<BookAppointmentByAdminCommand, ReturnBase<bool>>,
        IRequestHandler<ConfirmAppointmentCommand, ReturnBase<bool>>,
        IRequestHandler<CompleteAppointmentCommand, ReturnBase<bool>>,
        IRequestHandler<CancelAppointmentCommand, ReturnBase<bool>>
    {

        private readonly IAppointmentService _appointmentService;
        private readonly IMapper _mapper;

        public AppointmentCommandHandler(IAppointmentService appointmentService, IMapper mapper)
        {
            _appointmentService = appointmentService;
            _mapper = mapper;
        }
        public async Task<ReturnBase<bool>> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var appointmentEntity = _mapper.Map<Domain.Entities.Appointment>(request);

                var bookAppointmentResult = await _appointmentService.BookAppointmentAsync(appointmentEntity);

                if (!bookAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(bookAppointmentResult.Message);

                return ReturnBaseHandler.Success(true, bookAppointmentResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
        public async Task<ReturnBase<bool>> Handle(BookAppointmentByAdminCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var appointmentEntity = _mapper.Map<Domain.Entities.Appointment>(request);

                var bookAppointmentResult = await _appointmentService.BookAppointmentByAdminAsync(appointmentEntity);

                if (!bookAppointmentResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(bookAppointmentResult.Message);

                return ReturnBaseHandler.Success(true, bookAppointmentResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(ConfirmAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var confirmResult = await _appointmentService.ConfirmAppointmentAsync(request.AppointmentId);

                if (!confirmResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(confirmResult.Message);

                return ReturnBaseHandler.Success(confirmResult.Data, confirmResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(CompleteAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var completeResult = await _appointmentService.CompleteAppointmentAsync(request.AppointmentId);

                if (!completeResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(completeResult.Message);

                return ReturnBaseHandler.Success(completeResult.Data, completeResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var cancelResult = await _appointmentService.CancelAppointmentAsync(request.AppointmentId);

                if (!cancelResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(cancelResult.Message);

                return ReturnBaseHandler.Success(cancelResult.Data, cancelResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
