using AutoMapper;
using MediatR;
using MedScanAI.Core.Features.AppointmentFeature.Query.Model;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;
using MedScanAI.Shared.SharedResponse;

namespace MedScanAI.Core.Features.AppointmentFeature.Query.Handler
{
    public class AppointmentQueryHandler :
        IRequestHandler<GetDoctorsForAppointmentsQuery, ReturnBase<List<GetDoctorsForAppointmentsResponse>>>,
        IRequestHandler<GetTodayAppointmentsQuery, ReturnBase<List<GetTodayAppointmentsResponse>>>,
        IRequestHandler<GetPatientAppointmentsQuery, ReturnBase<List<GetPatientAppointmentsResponse>>>
    {

        private readonly IAppointmentService _appointmentsService;
        private readonly IMapper _mapper;

        public AppointmentQueryHandler(IAppointmentService appointmentService, IMapper mapper)
        {
            _appointmentsService = appointmentService;
            _mapper = mapper;
        }

        public async Task<ReturnBase<List<GetDoctorsForAppointmentsResponse>>> Handle(GetDoctorsForAppointmentsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var doctorsResult = await _appointmentsService.GetDoctorsForAppointmentsAsync(request.PatientId);

                if (!doctorsResult.Succeeded)
                    return ReturnBaseHandler.Failed<List<GetDoctorsForAppointmentsResponse>>(doctorsResult.Message);

                var mappedResult = _mapper.Map<List<GetDoctorsForAppointmentsResponse>>(doctorsResult.Data);

                return ReturnBaseHandler.Success(mappedResult, doctorsResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetDoctorsForAppointmentsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<List<GetTodayAppointmentsResponse>>> Handle(GetTodayAppointmentsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var appointmentsResult = await _appointmentsService.GetTodaysAppointmentsAsync();

                if (!appointmentsResult.Succeeded)
                    return ReturnBaseHandler.Failed<List<GetTodayAppointmentsResponse>>(appointmentsResult.Message);

                var mappedResult = _mapper.Map<List<GetTodayAppointmentsResponse>>(appointmentsResult.Data);

                return ReturnBaseHandler.Success(mappedResult, appointmentsResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetTodayAppointmentsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<List<GetPatientAppointmentsResponse>>> Handle(GetPatientAppointmentsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var appointmentsResult = await _appointmentsService.GetPatientAppointmentsAsync(request.PatientId);

                if (!appointmentsResult.Succeeded)
                    return ReturnBaseHandler.Failed<List<GetPatientAppointmentsResponse>>(appointmentsResult.Message);

                var mappedResult = _mapper.Map<List<GetPatientAppointmentsResponse>>(appointmentsResult.Data);

                return ReturnBaseHandler.Success(mappedResult, appointmentsResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetPatientAppointmentsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
