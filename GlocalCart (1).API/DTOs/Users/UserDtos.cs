using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.DTOs.Users
{
    public class UpdateProfileDto
    {
        [Required, MaxLength(150)]
        public string? FullName { get; set; }

        [Required, RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."), MaxLength(20)]
        public string? Phone { get; set; }

        [EmailAddress, MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(500)]
        public string? AvatarUrl { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AddressDto
    {
        public int Id { get; set; }
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Zipcode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }

    public class CreateAddressDto
    {
        [Required, MaxLength(300)]
        public string StreetAddress { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string State { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Zipcode { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;
    }

    public class CreateCreditCardDto
    {
        [Required, MaxLength(150)]
        public string NameOnCard { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string CardNumber { get; set; } = string.Empty;

        [Required, MaxLength(10)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? BillingStreet { get; set; }

        [MaxLength(100)]
        public string? BillingCity { get; set; }

        [MaxLength(100)]
        public string? BillingState { get; set; }

        [MaxLength(20)]
        public string? BillingZip { get; set; }

        [MaxLength(100)]
        public string? BillingCountry { get; set; }
    }

    public class CreateBankAccountDto
    {
        [Required, MaxLength(200)]
        public string BankName { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string RoutingNumber { get; set; } = string.Empty;

        [Required, MaxLength(30)]
        public string AccountNumber { get; set; } = string.Empty;
    }

    public class PaymentMethodResponseDto
    {
        public List<CreditCardResponseDto> CreditCards { get; set; } = new();
        public List<BankAccountResponseDto> BankAccounts { get; set; } = new();
    }

    public class CreditCardResponseDto
    {
        public int Id { get; set; }
        public string NameOnCard { get; set; } = string.Empty;
        public string CardNumberMasked { get; set; } = string.Empty;
    }

    public class BankAccountResponseDto
    {
        public int Id { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string AccountNumberMasked { get; set; } = string.Empty;
    }
}
