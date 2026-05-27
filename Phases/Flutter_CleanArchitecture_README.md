# Flutter Clean Architecture — Best Practices Guide

> **Version:** Flutter 3.x · Dart 3.x · Null Safety  
> **Pattern:** Clean Architecture + Feature-First + BLoC/Cubit  
> **Target:** Production-grade mobile applications (iOS & Android)

---

## Table of Contents

1. [Philosophy & Principles](#1-philosophy--principles)
2. [Project Structure](#2-project-structure)
3. [Architecture Layers](#3-architecture-layers)
4. [Feature Module Anatomy](#4-feature-module-anatomy)
5. [State Management — BLoC / Cubit](#5-state-management--bloc--cubit)
6. [Dependency Injection](#6-dependency-injection)
7. [Navigation — GoRouter](#7-navigation--gorouter)
8. [Error Handling](#8-error-handling)
9. [Networking & API Layer](#9-networking--api-layer)
10. [Local Storage](#10-local-storage)
11. [Environment Configuration](#11-environment-configuration)
12. [Testing Strategy](#12-testing-strategy)
13. [Code Generation](#13-code-generation)
14. [CI/CD Pipeline](#14-cicd-pipeline)
15. [Essential Packages](#15-essential-packages)
16. [Conventions & Code Style](#16-conventions--code-style)

---

## 1. Philosophy & Principles

### Core Rules

| Rule | Description |
|------|-------------|
| **Separation of Concerns** | Each layer owns exactly one responsibility. Never mix UI logic with business logic. |
| **Dependency Rule** | Dependencies point inward only: `Data → Domain ← Presentation`. Domain never depends on anything external. |
| **Testability First** | Every class is injectable. No static calls in business logic. No direct `DateTime.now()` or `Random()` — inject them. |
| **Feature-First Folders** | Code is grouped by feature, not by type. `features/auth/` not `blocs/auth_bloc.dart`. |
| **Fail Loudly in Dev, Silently in Prod** | Assertions and `FlutterError` in debug. Sealed failure types in release. |
| **One Source of Truth** | Single state object per BLoC/Cubit. No scattered booleans (`isLoading`, `hasError`, `data`). |

### SOLID in Flutter Context

- **S** — One BLoC per feature screen, not one BLoC per app.
- **O** — Use abstract repositories so data sources are swappable.
- **L** — Subtypes of `Failure` are interchangeable at the use-case boundary.
- **I** — Split large repository interfaces into focused contracts.
- **D** — UI depends on abstract use cases. Use cases depend on abstract repositories.

---

## 2. Project Structure

```
my_app/
├── lib/
│   ├── app/
│   │   ├── app.dart                  # MaterialApp / root widget
│   │   ├── app_bloc_observer.dart    # Global BLoC observer
│   │   └── router/
│   │       ├── app_router.dart       # GoRouter instance
│   │       └── app_routes.dart       # Route name constants
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   └── app_constants.dart
│   │   ├── di/
│   │   │   ├── injection.dart        # GetIt container
│   │   │   └── injection.config.dart # Generated
│   │   ├── domain/
│   │   │   ├── failures/
│   │   │   │   └── failure.dart      # Base sealed failure class
│   │   │   └── usecase/
│   │   │       └── usecase.dart      # Base UseCase<Type, Params>
│   │   ├── error/
│   │   │   └── exceptions.dart       # Network / cache exceptions
│   │   ├── network/
│   │   │   ├── api_client.dart       # Dio instance + interceptors
│   │   │   └── network_info.dart     # Connectivity check
│   │   ├── presentation/
│   │   │   ├── theme/
│   │   │   │   ├── app_theme.dart
│   │   │   │   ├── app_colors.dart
│   │   │   │   └── app_text_styles.dart
│   │   │   └── widgets/              # Shared widgets
│   │   │       ├── app_button.dart
│   │   │       ├── app_loader.dart
│   │   │       └── app_error_widget.dart
│   │   └── utils/
│   │       ├── extensions/
│   │       └── validators/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   ├── home/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   └── profile/
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   │
│   ├── l10n/
│   │   ├── arb/
│   │   │   ├── app_en.arb
│   │   │   └── app_ar.arb
│   │   └── l10n.dart
│   │
│   ├── main_development.dart
│   ├── main_staging.dart
│   └── main_production.dart
│
├── test/
│   ├── core/
│   ├── features/
│   │   └── auth/
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   └── helpers/
│       ├── mock_helper.dart          # Shared mocks (Mocktail)
│       └── pump_app.dart             # Widget test helper
│
├── integration_test/
│   └── app_test.dart
│
├── analysis_options.yaml
├── pubspec.yaml
└── .fvmrc                            # Flutter version lock
```

---

## 3. Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│         Pages · Widgets · BLoC/Cubit · State Objects         │
│              (Flutter framework lives here)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────┐
│                       DOMAIN LAYER                           │
│        Use Cases · Entities · Repository Interfaces          │
│           (Pure Dart — ZERO external dependencies)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ implemented by
┌──────────────────────────▼──────────────────────────────────┐
│                        DATA LAYER                            │
│   Repository Impls · Remote DS · Local DS · DTOs/Mappers     │
│              (Dio, Hive, SharedPreferences, etc.)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Domain Layer** (the heart — never changes regardless of framework updates)
- Contains `Entity` classes (pure Dart, no `toJson`/`fromJson`)
- Contains `UseCase` abstract classes
- Contains `Repository` abstract interfaces
- Contains `Failure` sealed classes
- Zero imports from Flutter or any third-party package

**Data Layer** (the adapter)
- Implements repository contracts from Domain
- Contains `Model` classes (DTOs with `fromJson`/`toJson`)
- Contains `Mapper` classes (`Model → Entity`)
- Contains `RemoteDataSource` (API calls)
- Contains `LocalDataSource` (cache/storage)

**Presentation Layer** (the delivery mechanism)
- Contains `Page` and `Widget` classes
- Contains `BLoC`/`Cubit` classes and `State` objects
- Calls use cases via DI — never calls repositories directly
- No business logic — only UI logic (animations, form validation UX)

---

## 4. Feature Module Anatomy

```
features/auth/
├── data/
│   ├── datasources/
│   │   ├── auth_remote_data_source.dart
│   │   └── auth_local_data_source.dart
│   ├── models/
│   │   ├── user_model.dart          # DTO: fromJson/toJson
│   │   └── token_model.dart
│   ├── mappers/
│   │   └── user_mapper.dart         # UserModel → User entity
│   └── repositories/
│       └── auth_repository_impl.dart
│
├── domain/
│   ├── entities/
│   │   └── user.dart                # Pure entity, no JSON
│   ├── repositories/
│   │   └── auth_repository.dart     # Abstract interface
│   └── usecases/
│       ├── sign_in_use_case.dart
│       ├── sign_out_use_case.dart
│       └── get_cached_user_use_case.dart
│
└── presentation/
    ├── bloc/
    │   ├── sign_in/
    │   │   ├── sign_in_bloc.dart
    │   │   ├── sign_in_event.dart
    │   │   └── sign_in_state.dart
    │   └── auth/
    │       └── auth_cubit.dart       # Global auth session state
    ├── pages/
    │   ├── sign_in_page.dart
    │   └── sign_up_page.dart
    └── widgets/
        ├── email_field.dart
        └── password_field.dart
```

### Entity — No framework, no JSON

```dart
// features/auth/domain/entities/user.dart
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
  });

  final String id;
  final String email;
  final String displayName;
  final UserRole role;

  @override
  List<Object?> get props => [id, email, displayName, role];
}

enum UserRole { admin, member, guest }
```

### Model — Data layer DTO

```dart
// features/auth/data/models/user_model.dart
class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
  });

  final String id;
  final String email;
  final String displayName;
  final String role;

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        email: json['email'] as String,
        displayName: json['display_name'] as String,
        role: json['role'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'display_name': displayName,
        'role': role,
      };
}
```

### Mapper — Keeps layers decoupled

```dart
// features/auth/data/mappers/user_mapper.dart
extension UserModelMapper on UserModel {
  User toEntity() => User(
        id: id,
        email: email,
        displayName: displayName,
        role: UserRole.values.firstWhere(
          (r) => r.name == role,
          orElse: () => UserRole.guest,
        ),
      );
}
```

### Use Case — Single-responsibility business action

```dart
// features/auth/domain/usecases/sign_in_use_case.dart
typedef SignInParams = ({String email, String password});

class SignInUseCase implements UseCase<User, SignInParams> {
  const SignInUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Either<Failure, User>> call(SignInParams params) =>
      _repository.signIn(email: params.email, password: params.password);
}
```

### Repository Contract

```dart
// features/auth/domain/repositories/auth_repository.dart
abstract interface class AuthRepository {
  Future<Either<Failure, User>> signIn({
    required String email,
    required String password,
  });

  Future<Either<Failure, User>> signUp({
    required String email,
    required String password,
    required String displayName,
  });

  Future<Either<Failure, Unit>> signOut();

  Future<Either<Failure, User>> getCachedUser();
}
```

### Repository Implementation

```dart
// features/auth/data/repositories/auth_repository_impl.dart
@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._networkInfo,
  );

  final AuthRemoteDataSource _remoteDataSource;
  final AuthLocalDataSource _localDataSource;
  final NetworkInfo _networkInfo;

  @override
  Future<Either<Failure, User>> signIn({
    required String email,
    required String password,
  }) async {
    if (!await _networkInfo.isConnected) {
      return const Left(Failure.network());
    }
    try {
      final model = await _remoteDataSource.signIn(
        email: email,
        password: password,
      );
      await _localDataSource.cacheUser(model);
      return Right(model.toEntity());
    } on ServerException catch (e) {
      return Left(Failure.server(message: e.message, code: e.statusCode));
    } on UnauthorizedException {
      return const Left(Failure.unauthorized());
    }
  }

  // ... other methods
}
```

---

## 5. State Management — BLoC / Cubit

### When to use BLoC vs Cubit

| Situation | Use |
|-----------|-----|
| Complex flows with multiple event types | **BLoC** |
| Simple state transitions (loading/success/error) | **Cubit** |
| Global session state (auth, theme, locale) | **Cubit** |
| Form with multi-step validation | **BLoC** |

### State — Always a sealed class

```dart
// features/auth/presentation/bloc/sign_in/sign_in_state.dart
sealed class SignInState extends Equatable {
  const SignInState();

  @override
  List<Object?> get props => [];
}

final class SignInInitial extends SignInState {
  const SignInInitial();
}

final class SignInLoading extends SignInState {
  const SignInLoading();
}

final class SignInSuccess extends SignInState {
  const SignInSuccess(this.user);
  final User user;

  @override
  List<Object?> get props => [user];
}

final class SignInFailure extends SignInState {
  const SignInFailure(this.failure);
  final Failure failure;

  @override
  List<Object?> get props => [failure];
}
```

### BLoC Implementation

```dart
// features/auth/presentation/bloc/sign_in/sign_in_bloc.dart
@injectable
class SignInBloc extends Bloc<SignInEvent, SignInState> {
  SignInBloc(this._signInUseCase) : super(const SignInInitial()) {
    on<SignInSubmitted>(_onSignInSubmitted);
  }

  final SignInUseCase _signInUseCase;

  Future<void> _onSignInSubmitted(
    SignInSubmitted event,
    Emitter<SignInState> emit,
  ) async {
    emit(const SignInLoading());
    final result = await _signInUseCase(
      (email: event.email, password: event.password),
    );
    result.fold(
      (failure) => emit(SignInFailure(failure)),
      (user) => emit(SignInSuccess(user)),
    );
  }
}
```

### UI — Consuming state correctly

```dart
// features/auth/presentation/pages/sign_in_page.dart
class SignInPage extends StatelessWidget {
  const SignInPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<SignInBloc>(),
      child: const _SignInView(),
    );
  }
}

class _SignInView extends StatelessWidget {
  const _SignInView();

  @override
  Widget build(BuildContext context) {
    return BlocListener<SignInBloc, SignInState>(
      listener: (context, state) {
        switch (state) {
          case SignInSuccess():
            context.go(AppRoutes.home);
          case SignInFailure(:final failure):
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(failure.userMessage)),
            );
          default:
            break;
        }
      },
      child: Scaffold(
        body: BlocBuilder<SignInBloc, SignInState>(
          buildWhen: (previous, current) =>
              current is SignInLoading || current is SignInInitial,
          builder: (context, state) {
            if (state is SignInLoading) return const AppLoader();
            return const _SignInForm();
          },
        ),
      ),
    );
  }
}
```

---

## 6. Dependency Injection

### Setup with `get_it` + `injectable`

```dart
// core/di/injection.dart
@InjectableInit(
  initializerName: 'init',
  preferRelativeImports: true,
  asExtension: true,
)
final GetIt getIt = GetIt.instance;

Future<void> configureDependencies(AppEnvironment env) async =>
    getIt.init(environment: env.name);
```

### Registration Annotations

```dart
// Singleton — created once for app lifetime
@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository { ... }

// Factory — new instance per injection
@injectable
class SignInBloc extends Bloc<SignInEvent, SignInState> { ... }

// Named environments
@LazySingleton(as: ApiClient, env: [Environment.prod])
class ProdApiClient implements ApiClient { ... }

@LazySingleton(as: ApiClient, env: [Environment.dev])
class DevApiClient implements ApiClient { ... }
```

### Accessing in widgets

```dart
// Always via getIt — never service-locate in build methods
BlocProvider(
  create: (_) => getIt<SignInBloc>(),
  child: ...,
)
```

---

## 7. Navigation — GoRouter

```dart
// app/router/app_router.dart
@singleton
class AppRouter {
  AppRouter(this._authCubit);
  final AuthCubit _authCubit;

  late final router = GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: GoRouterRefreshStream(_authCubit.stream),
    redirect: _redirect,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        builder: (_, __) => const SignInPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            builder: (_, __) => const HomePage(),
          ),
          GoRoute(
            path: '${AppRoutes.profile}/:userId',
            builder: (_, state) => ProfilePage(
              userId: state.pathParameters['userId']!,
            ),
          ),
        ],
      ),
    ],
  );

  String? _redirect(BuildContext context, GoRouterState state) {
    final authState = _authCubit.state;
    final isOnAuth = state.matchedLocation == AppRoutes.signIn;

    if (authState is AuthUnauthenticated && !isOnAuth) return AppRoutes.signIn;
    if (authState is AuthAuthenticated && isOnAuth) return AppRoutes.home;
    return null;
  }
}
```

---

## 8. Error Handling

### Failure sealed class hierarchy

```dart
// core/domain/failures/failure.dart
sealed class Failure extends Equatable {
  const Failure();

  /// Human-readable message for UI display
  String get userMessage => switch (this) {
        NetworkFailure() => 'No internet connection. Please try again.',
        ServerFailure(:final message) =>
          message ?? 'Something went wrong. Please try again.',
        UnauthorizedFailure() => 'Session expired. Please sign in again.',
        NotFoundFailure() => 'The requested resource was not found.',
        CacheFailure() => 'Failed to load cached data.',
        ValidationFailure(:final message) => message,
        UnknownFailure() => 'An unexpected error occurred.',
      };

  @override
  List<Object?> get props => [];

  const factory Failure.network() = NetworkFailure;
  const factory Failure.server({String? message, int? code}) = ServerFailure;
  const factory Failure.unauthorized() = UnauthorizedFailure;
  const factory Failure.notFound() = NotFoundFailure;
  const factory Failure.cache() = CacheFailure;
  const factory Failure.validation({required String message}) = ValidationFailure;
  const factory Failure.unknown() = UnknownFailure;
}

final class NetworkFailure extends Failure {
  const NetworkFailure();
}

final class ServerFailure extends Failure {
  const ServerFailure({this.message, this.code});
  final String? message;
  final int? code;

  @override
  List<Object?> get props => [message, code];
}

final class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure();
}

final class NotFoundFailure extends Failure {
  const NotFoundFailure();
}

final class CacheFailure extends Failure {
  const CacheFailure();
}

final class ValidationFailure extends Failure {
  const ValidationFailure({required this.message});
  final String message;

  @override
  List<Object?> get props => [message];
}

final class UnknownFailure extends Failure {
  const UnknownFailure();
}
```

### Base UseCase

```dart
// core/domain/usecase/usecase.dart
abstract interface class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

abstract interface class NoParamsUseCase<Type> {
  Future<Either<Failure, Type>> call();
}

/// Use when a use case has no parameters
typedef NoParams = void;
```

---

## 9. Networking & API Layer

### Dio Setup with interceptors

```dart
// core/network/api_client.dart
@module
abstract class NetworkModule {
  @lazySingleton
  Dio dio(AppConfig config) {
    final dio = Dio(
      BaseOptions(
        baseUrl: config.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Accept': 'application/json'},
      ),
    );

    dio.interceptors.addAll([
      AuthInterceptor(getIt<TokenStorage>()),
      LoggingInterceptor(),           // dev only via kDebugMode
      RetryInterceptor(dio: dio, retries: 2),
    ]);

    return dio;
  }
}
```

### Auth Interceptor — Token refresh

```dart
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenStorage);
  final TokenStorage _tokenStorage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      try {
        final newToken = await _refreshToken();
        final opts = err.requestOptions
          ..headers['Authorization'] = 'Bearer $newToken';
        final response = await Dio().fetch(opts);
        return handler.resolve(response);
      } catch (_) {
        getIt<AuthCubit>().signOut();
      }
    }
    handler.next(err);
  }
}
```

### Exception mapping in Data Source

```dart
// features/auth/data/datasources/auth_remote_data_source.dart
@lazySingleton
class AuthRemoteDataSource {
  const AuthRemoteDataSource(this._dio);
  final Dio _dio;

  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/sign-in',
        data: {'email': email, 'password': password},
      );
      return UserModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _mapDioException(e);
    }
  }

  Exception _mapDioException(DioException e) => switch (e.type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.receiveTimeout ||
        DioExceptionType.sendTimeout =>
          const NetworkException(),
        DioExceptionType.badResponse => switch (e.response?.statusCode) {
            401 => const UnauthorizedException(),
            404 => const NotFoundException(),
            _ => ServerException(
                message: _extractMessage(e.response?.data),
                statusCode: e.response?.statusCode,
              ),
          },
        _ => const NetworkException(),
      };
}
```

---

## 10. Local Storage

### Strategy by data type

| Data | Storage | Package |
|------|---------|---------|
| Auth tokens | Secure storage | `flutter_secure_storage` |
| User preferences | Key-value | `shared_preferences` |
| Structured objects / cache | NoSQL box | `hive` |
| Large / relational data | SQL | `drift` |

```dart
// Hive type adapter for caching
@HiveType(typeId: 0)
class UserHiveModel extends HiveObject {
  @HiveField(0) late String id;
  @HiveField(1) late String email;
  @HiveField(2) late String displayName;
  @HiveField(3) late String role;
}
```

---

## 11. Environment Configuration

```dart
// Three entry points — never use dart-define string concatenation in widgets
// main_development.dart
void main() async {
  await bootstrap(AppConfig.development());
}

// main_staging.dart
void main() async {
  await bootstrap(AppConfig.staging());
}

// main_production.dart
void main() async {
  await bootstrap(AppConfig.production());
}
```

```dart
// core/config/app_config.dart
@immutable
class AppConfig extends Equatable {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.sentryDsn,
    required this.enableLogging,
  });

  factory AppConfig.development() => const AppConfig(
        environment: AppEnvironment.dev,
        apiBaseUrl: 'https://dev-api.myapp.com/v1',
        sentryDsn: '',
        enableLogging: true,
      );

  factory AppConfig.staging() => const AppConfig(
        environment: AppEnvironment.staging,
        apiBaseUrl: 'https://staging-api.myapp.com/v1',
        sentryDsn: 'https://sentry_dsn_here',
        enableLogging: true,
      );

  factory AppConfig.production() => const AppConfig(
        environment: AppEnvironment.prod,
        apiBaseUrl: 'https://api.myapp.com/v1',
        sentryDsn: 'https://sentry_dsn_here',
        enableLogging: false,
      );

  final AppEnvironment environment;
  final String apiBaseUrl;
  final String sentryDsn;
  final bool enableLogging;

  bool get isProduction => environment == AppEnvironment.prod;

  @override
  List<Object?> get props => [environment, apiBaseUrl];
}

enum AppEnvironment { dev, staging, prod }
```

---

## 12. Testing Strategy

### The Testing Pyramid

```
         /\
        /  \          E2E / Integration Tests
       /────\         (integration_test/ — Patrol or native)
      /      \        
     /────────\       Widget Tests
    /          \      (test/features/*/presentation/)
   /────────────\     
  /              \    Unit Tests  ← Majority here
 /────────────────\   (test/features/*/domain/ & data/)
```

### Unit Test — Use Case

```dart
// test/features/auth/domain/usecases/sign_in_use_case_test.dart
void main() {
  late SignInUseCase sut;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    sut = SignInUseCase(mockRepository);
  });

  group('SignInUseCase', () {
    const tEmail = 'test@example.com';
    const tPassword = 'password123';
    const tParams = (email: tEmail, password: tPassword);
    final tUser = User(
      id: '1',
      email: tEmail,
      displayName: 'Test User',
      role: UserRole.member,
    );

    test('should return User when repository call succeeds', () async {
      when(() => mockRepository.signIn(email: tEmail, password: tPassword))
          .thenAnswer((_) async => Right(tUser));

      final result = await sut(tParams);

      expect(result, Right(tUser));
      verify(() => mockRepository.signIn(
            email: tEmail,
            password: tPassword,
          )).called(1);
    });

    test('should return NetworkFailure when there is no connection', () async {
      when(() => mockRepository.signIn(email: tEmail, password: tPassword))
          .thenAnswer((_) async => const Left(Failure.network()));

      final result = await sut(tParams);

      expect(result, const Left(Failure.network()));
    });
  });
}
```

### Widget Test

```dart
// test/features/auth/presentation/pages/sign_in_page_test.dart
void main() {
  late MockSignInBloc mockBloc;

  setUp(() => mockBloc = MockSignInBloc());

  Widget buildSubject() => MaterialApp(
        home: BlocProvider<SignInBloc>.value(
          value: mockBloc,
          child: const SignInPage(),
        ),
      );

  testWidgets('shows loader when state is SignInLoading', (tester) async {
    when(() => mockBloc.state).thenReturn(const SignInLoading());

    await tester.pumpWidget(buildSubject());

    expect(find.byType(AppLoader), findsOneWidget);
    expect(find.byType(SignInForm), findsNothing);
  });

  testWidgets('navigates to home on SignInSuccess', (tester) async {
    whenListen(
      mockBloc,
      Stream.fromIterable([const SignInLoading(), SignInSuccess(tUser)]),
      initialState: const SignInInitial(),
    );
    // verify navigation...
  });
}
```

### BLoC Test

```dart
// test/features/auth/presentation/bloc/sign_in_bloc_test.dart
void main() {
  late SignInBloc bloc;
  late MockSignInUseCase mockUseCase;

  setUp(() {
    mockUseCase = MockSignInUseCase();
    bloc = SignInBloc(mockUseCase);
  });

  tearDown(() => bloc.close());

  blocTest<SignInBloc, SignInState>(
    'emits [Loading, Success] when sign in succeeds',
    build: () {
      when(() => mockUseCase(any())).thenAnswer((_) async => Right(tUser));
      return bloc;
    },
    act: (b) => b.add(
      const SignInSubmitted(email: 'test@example.com', password: 'pass'),
    ),
    expect: () => [const SignInLoading(), SignInSuccess(tUser)],
  );
}
```

---

## 13. Code Generation

```yaml
# Run after modifying annotated files:
# flutter pub run build_runner build --delete-conflicting-outputs

# Or watch mode during development:
# flutter pub run build_runner watch --delete-conflicting-outputs
```

Files that trigger generation:
- `@injectable` / `@module` → `injection.config.dart`
- `@HiveType` → `*.g.dart` Hive adapters
- `@freezed` (optional, for complex value objects) → `*.freezed.dart`

---

## 14. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  analyze-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version-file: .fvmrc
          cache: true

      - name: Install dependencies
        run: flutter pub get

      - name: Verify formatting
        run: dart format --set-exit-if-changed .

      - name: Analyze
        run: flutter analyze --fatal-infos

      - name: Run tests with coverage
        run: flutter test --coverage --test-randomize-ordering-seed random

      - name: Check coverage threshold
        run: |
          flutter pub global activate coverage
          genhtml coverage/lcov.info -o coverage/html
          # Fail if coverage < 80%
          COVERAGE=$(lcov --summary coverage/lcov.info | grep "lines" | awk '{print $2}' | tr -d '%')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then exit 1; fi

  build-android:
    needs: analyze-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version-file: .fvmrc
          cache: true
      - run: flutter build apk -t lib/main_production.dart --release

  build-ios:
    needs: analyze-and-test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version-file: .fvmrc
          cache: true
      - run: flutter build ios -t lib/main_production.dart --no-codesign
```

---

## 15. Essential Packages

```yaml
dependencies:
  # State management
  flutter_bloc: ^8.1.6
  bloc: ^8.1.4

  # DI
  get_it: ^8.0.2
  injectable: ^2.4.4

  # Navigation
  go_router: ^14.2.7

  # Networking
  dio: ^5.7.0
  connectivity_plus: ^6.0.5

  # Local storage
  shared_preferences: ^2.3.2
  flutter_secure_storage: ^9.2.2
  hive_flutter: ^1.1.0

  # Functional programming (Either)
  fpdart: ^1.1.0

  # Equality
  equatable: ^2.0.5

  # Serialization
  json_annotation: ^4.9.0

  # Internationalization
  flutter_localizations:
    sdk: flutter
  intl: ^0.19.0

  # Error tracking
  sentry_flutter: ^8.8.0

dev_dependencies:
  # Code generation
  build_runner: ^2.4.12
  injectable_generator: ^2.6.2
  json_serializable: ^6.8.0
  hive_generator: ^2.0.1

  # Testing
  flutter_test:
    sdk: flutter
  bloc_test: ^9.1.7
  mocktail: ^1.0.4

  # Linting
  flutter_lints: ^4.0.0
  very_good_analysis: ^6.0.0
```

---

## 16. Conventions & Code Style

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `snake_case` | `sign_in_bloc.dart` |
| Classes | `PascalCase` | `SignInBloc` |
| Variables & methods | `camelCase` | `signInUseCase` |
| Constants | `camelCase` | `kMaxRetryCount` |
| Enums | `PascalCase` values `camelCase` | `UserRole.admin` |
| Private members | `_camelCase` | `_repository` |

### Commit Convention (Conventional Commits)

```
feat(auth): add biometric sign-in support
fix(profile): correct avatar upload failure on iOS 17
refactor(core): migrate Failure to sealed class hierarchy
test(auth): add bloc test for token refresh flow
chore(deps): upgrade flutter_bloc to 8.1.6
```

### Pull Request Checklist

- [ ] New feature is covered by unit tests (≥ 80% coverage)
- [ ] Widget tests added for new screens
- [ ] `flutter analyze` passes with zero warnings
- [ ] `dart format` applied
- [ ] No hardcoded strings (use `l10n`)
- [ ] No business logic in widgets
- [ ] No direct repository calls from presentation layer
- [ ] `build_runner` artifacts regenerated if needed
- [ ] Feature flag added if rolling out gradually

### Do's and Don'ts

```dart
// ✅ DO: Use sealed state classes
sealed class SignInState extends Equatable { ... }

// ❌ DON'T: Use raw booleans for state
class SignInState {
  final bool isLoading;
  final bool hasError;
  final String? errorMessage;
  final User? user; // Which combinations are valid? Unclear.
}

// ✅ DO: Inject dependencies through constructor
@injectable
class SignInBloc extends Bloc {
  SignInBloc(this._useCase) : ...;
  final SignInUseCase _useCase;
}

// ❌ DON'T: Service-locate inside business logic
class SignInBloc extends Bloc {
  Future<void> _onEvent(event, emit) async {
    final result = await getIt<SignInUseCase>()(...); // ❌
  }
}

// ✅ DO: Return Either from repository
Future<Either<Failure, User>> signIn(...) async { ... }

// ❌ DON'T: Throw from repository
Future<User> signIn(...) async {
  throw ServerException(); // ❌ caller must know to catch
}

// ✅ DO: Use switch for exhaustive state handling
switch (state) {
  case SignInLoading(): ...
  case SignInSuccess(): ...
  case SignInFailure(): ...
  case SignInInitial(): ...
}

// ❌ DON'T: Use is checks — non-exhaustive, silent misses
if (state is SignInLoading) { ... }
```

---

## Architecture Checklist

Before shipping any feature, verify:

- [ ] Domain layer has zero Flutter or third-party imports
- [ ] Repository interface lives in `domain/`, implementation in `data/`
- [ ] Use case has a single public `call()` method
- [ ] BLoC/Cubit emits sealed state classes only
- [ ] All failures are typed `Failure` subtypes — no raw exceptions in domain
- [ ] Mappers convert between Models ↔ Entities
- [ ] DI registrations annotated correctly (`@injectable`, `@lazySingleton`, etc.)
- [ ] Unit tests for all use cases and repository impls
- [ ] Widget tests for all pages
- [ ] No `context.read<>()` calls inside `initState` (use `BlocProvider` + events)
- [ ] `GoRouter` redirect handles all auth state transitions
- [ ] Strings extracted to ARB files for i18n

---

*Maintained by the Mobile Architecture Team · Flutter 3.x · Last updated 2025*
