using System.Net;

namespace MedScanAI.Shared.Base
{
    public static class ReturnBaseHandler
    {
        public static ReturnBase<T> Success<T>(T entity, string? message = null)
        {
            return new ReturnBase<T>()
            {
                Data = entity,
                StatusCode = HttpStatusCode.OK,
                Succeeded = true,
                Message = message ?? "Success",
            };
        }
        public static ReturnBase<T> Failed<T>(string? message = null)
        {
            return new ReturnBase<T>()
            {
                StatusCode = HttpStatusCode.ExpectationFailed,
                Succeeded = false,
                Message = message ?? "Failed"
            };
        }
    }
}
