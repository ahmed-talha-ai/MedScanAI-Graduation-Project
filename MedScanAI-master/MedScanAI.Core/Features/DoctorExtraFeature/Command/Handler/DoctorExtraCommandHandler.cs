using MediatR;
using MedScanAI.Core.Features.DoctorExtraFeature.Command.Model;
using MedScanAI.Domain.Entities;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Command.Handler
{
    public class DoctorExtraCommandHandler :
        IRequestHandler<UpdateDoctorExtraCommand, ReturnBase<bool>>,
        IRequestHandler<SubmitDoctorReviewCommand, ReturnBase<bool>>
    {
        private readonly IDoctorExtraService _doctorExtraService;

        public DoctorExtraCommandHandler(IDoctorExtraService doctorExtraService)
        {
            _doctorExtraService = doctorExtraService;
        }

        public async Task<ReturnBase<bool>> Handle(UpdateDoctorExtraCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var extra = new DoctorExtra
                {
                    DoctorId = request.DoctorId,
                    Bio = request.Bio,
                    ClinicAddress = request.ClinicAddress,
                    ConsultationFee = request.ConsultationFee,
                    Governorate = request.Governorate,
                    PhotoBase64 = request.PhotoBase64
                };

                var result = await _doctorExtraService.UpdateExtraAsync(extra);
                if (result)
                    return ReturnBaseHandler.Success(true, "Doctor extra info updated successfully");
                
                return ReturnBaseHandler.Failed<bool>("Failed to update doctor extra info");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<bool>> Handle(SubmitDoctorReviewCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var review = new DoctorReview
                {
                    DoctorId = request.DoctorId,
                    PatientId = request.PatientId,
                    Rating = request.Rating,
                    Comment = request.Comment
                };

                var result = await _doctorExtraService.SubmitReviewAsync(review);
                if (result)
                    return ReturnBaseHandler.Success(true, "Review submitted successfully");
                
                return ReturnBaseHandler.Failed<bool>("Failed to submit review");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<bool>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
