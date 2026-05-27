using MediatR;
using MedScanAI.Core.Features.Doctor.Command.Model;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.Doctor.Command.Handler
{
    public class DoctorCommandHandler :
        IRequestHandler<DeleteDoctorCommand, ReturnBase<bool>>,
        IRequestHandler<RestoreDoctorCommand, ReturnBase<bool>>
    {

        private readonly IDoctorService _doctorService;


        public DoctorCommandHandler(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        public async Task<ReturnBase<bool>> Handle(DeleteDoctorCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var deleteResult = await _doctorService.DeleteDoctorAsync(request.DoctorId);

                if (!deleteResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(deleteResult.Message);


                return ReturnBaseHandler.Success(true, deleteResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(RestoreDoctorCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var restoreResult = await _doctorService.RestoreDoctorAsync(request.DoctorId);

                if (!restoreResult.Succeeded)
                    return ReturnBaseHandler.Failed<bool>(restoreResult.Message);


                return ReturnBaseHandler.Success(true, restoreResult.Message);
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
