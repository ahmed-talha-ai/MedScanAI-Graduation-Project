using MediatR;
using MedScanAI.Core.Features.DoctorExtraFeature.Query.Model;
using MedScanAI.Core.Features.DoctorExtraFeature.Query.Response;
using MedScanAI.Service.Abstracts;
using MedScanAI.Shared.Base;

namespace MedScanAI.Core.Features.DoctorExtraFeature.Query.Handler
{
    public class DoctorExtraQueryHandler :
        IRequestHandler<GetDoctorExtraQuery, ReturnBase<GetDoctorExtraResponse>>,
        IRequestHandler<GetDoctorReviewsQuery, ReturnBase<List<GetDoctorReviewsResponse>>>
    {
        private readonly IDoctorExtraService _doctorExtraService;

        public DoctorExtraQueryHandler(IDoctorExtraService doctorExtraService)
        {
            _doctorExtraService = doctorExtraService;
        }

        public async Task<ReturnBase<GetDoctorExtraResponse>> Handle(GetDoctorExtraQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var extra = await _doctorExtraService.GetExtraAsync(request.DoctorId);
                
                if (extra == null)
                    return ReturnBaseHandler.Success(new GetDoctorExtraResponse(), "No extra info found for this doctor");

                var response = new GetDoctorExtraResponse
                {
                    Bio = extra.Bio,
                    ClinicAddress = extra.ClinicAddress,
                    ConsultationFee = extra.ConsultationFee,
                    Governorate = extra.Governorate,
                    PhotoBase64 = extra.PhotoBase64
                };

                return ReturnBaseHandler.Success(response, "Doctor extra info retrieved successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<GetDoctorExtraResponse>(ex.InnerException?.Message ?? ex.Message);
            }
        }

        public async Task<ReturnBase<List<GetDoctorReviewsResponse>>> Handle(GetDoctorReviewsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var reviews = await _doctorExtraService.GetReviewsAsync(request.DoctorId);
                
                var response = reviews.Select(r => new GetDoctorReviewsResponse
                {
                    Id = r.Id,
                    PatientName = r.Patient?.FullName ?? "Anonymous",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return ReturnBaseHandler.Success(response, "Doctor reviews retrieved successfully");
            }
            catch (Exception ex)
            {
                return ReturnBaseHandler.Failed<List<GetDoctorReviewsResponse>>(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
